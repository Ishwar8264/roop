/**
 * Purpose: Redis-based OTP service — production-grade OTP management
 * Responsibility: OTP generation, storage, verification, and rate limiting via Redis
 * Important Notes:
 *   - All OTP data stored in Redis (NOT in PostgreSQL — too slow for OTP operations)
 *   - OTP is hashed with bcrypt before storing — NEVER store plain OTP
 *   - Rate limiting per phone + per IP
 *   - Auto-expiry via Redis TTL
 *   - Resend cooldown enforcement
 *   - Max attempts tracking
 *
 * Redis Key Structure:
 *   otp:phone:{phone}         → { token: "hash", attempts: 0, createdAt: timestamp }
 *   otp:rate:{phone}          → count (with TTL = 1 hour)
 *   otp:ip:{ip}               → count (with TTL = 1 hour)
 */

import { redis } from "@/lib/config/redis";
import { OTP_CONFIG, REDIS_KEYS } from "@/lib/config/auth";
import { hashOtp, verifyOtpHash, generateOtp } from "@/lib/server/crypto";
import {
  AuthOtpInvalidError,
  AuthOtpExpiredError,
  AuthOtpMaxAttemptsError,
  AuthRateLimitedError,
} from "@/lib/server/errors";

// ==================== TYPES ====================

interface OtpData {
  /** bcrypt hash of the OTP */
  token: string;
  /** Number of failed verification attempts */
  attempts: number;
  /** When the OTP was created (Unix timestamp ms) */
  createdAt: number;
}

interface OtpRateLimitResult {
  allowed: boolean;
  reason?: "COOLDOWN" | "HOURLY_LIMIT" | "DAILY_LIMIT" | "IP_LIMIT";
  retryAfterSeconds?: number;
}

// ==================== STORE OTP ====================

/**
 * Store a new OTP in Redis with TTL
 * Automatically enforces rate limits before storing
 *
 * @param phone - Normalized 10-digit Indian phone number
 * @param ip - Client IP for IP-based rate limiting
 * @returns The plain OTP (to send via SMS) — NEVER returned in API response
 */
export async function storeOtp(
  phone: string,
  ip: string | null
): Promise<{ otp: string; expiresIn: number }> {
  // 1. Check rate limits
  const rateLimit = await checkOtpRateLimit(phone, ip);
  if (!rateLimit.allowed) {
    throw new AuthRateLimitedError(rateLimit.retryAfterSeconds);
  }

  // 2. Check resend cooldown
  const cooldown = await checkResendCooldown(phone);
  if (!cooldown.allowed) {
    throw new AuthRateLimitedError(cooldown.retryAfterSeconds);
  }

  // 3. Generate OTP
  const otp = generateOtp(OTP_CONFIG.LENGTH);
  const hashedOtp = await hashOtp(otp);

  // 4. Store in Redis with TTL
  const key = `${REDIS_KEYS.OTP_PREFIX}${phone}`;
  const data: OtpData = {
    token: hashedOtp,
    attempts: 0,
    createdAt: Date.now(),
  };

  await redis.setex(
    key,
    OTP_CONFIG.EXPIRY_SECONDS,
    JSON.stringify(data)
  );

  return {
    otp, // Return to caller for SMS sending — NEVER include in API response
    expiresIn: OTP_CONFIG.EXPIRY_SECONDS,
  };
}

// ==================== VERIFY OTP ====================

/**
 * Verify an OTP against the stored hash in Redis
 * Handles attempt counting, max attempts, and auto-cleanup
 *
 * @returns { verified: true } on success
 * @throws AuthOtpInvalidError, AuthOtpExpiredError, AuthOtpMaxAttemptsError
 */
export async function verifyStoredOtp(
  phone: string,
  plainOtp: string
): Promise<{ verified: true }> {
  const key = `${REDIS_KEYS.OTP_PREFIX}${phone}`;

  // 1. Get OTP data from Redis
  const raw = await redis.get(key);
  if (!raw) {
    throw new AuthOtpExpiredError();
  }

  const data: OtpData = JSON.parse(raw);

  // 2. Check max attempts
  if (data.attempts >= OTP_CONFIG.MAX_ATTEMPTS) {
    await redis.del(key);
    throw new AuthOtpMaxAttemptsError();
  }

  // 3. Verify OTP (bcrypt compare)
  const isValid = await verifyOtpHash(plainOtp, data.token);

  if (!isValid) {
    // Increment attempt counter
    data.attempts += 1;
    const attemptsRemaining = OTP_CONFIG.MAX_ATTEMPTS - data.attempts;

    if (attemptsRemaining <= 0) {
      await redis.del(key);
      throw new AuthOtpMaxAttemptsError();
    }

    // Update Redis with new attempt count
    const ttl = await redis.ttl(key);
    if (ttl > 0) {
      await redis.setex(key, ttl, JSON.stringify(data));
    }

    throw new AuthOtpInvalidError(attemptsRemaining);
  }

  // 4. OTP is valid — delete from Redis (one-time use)
  await redis.del(key);

  return { verified: true };
}

// ==================== RATE LIMITING ====================

/**
 * Check if a phone number can request a new OTP
 * Enforces: hourly limit, daily limit, IP limit
 */
async function checkOtpRateLimit(
  phone: string,
  ip: string | null
): Promise<OtpRateLimitResult> {
  const phoneKey = `${REDIS_KEYS.OTP_RATE_PREFIX}${phone}`;

  // Check phone hourly limit
  const phoneCount = await redis.incr(phoneKey);
  if (phoneCount === 1) {
    await redis.expire(phoneKey, 3600); // 1 hour TTL
  }
  if (phoneCount > OTP_CONFIG.HOURLY_LIMIT) {
    const ttl = await redis.ttl(phoneKey);
    return {
      allowed: false,
      reason: "HOURLY_LIMIT",
      retryAfterSeconds: Math.max(ttl, 1),
    };
  }

  // Check IP hourly limit
  if (ip) {
    const ipKey = `${REDIS_KEYS.OTP_IP_RATE_PREFIX}${ip}`;
    const ipCount = await redis.incr(ipKey);
    if (ipCount === 1) {
      await redis.expire(ipKey, 3600);
    }
    if (ipCount > OTP_CONFIG.IP_HOURLY_LIMIT) {
      const ttl = await redis.ttl(ipKey);
      return {
        allowed: false,
        reason: "IP_LIMIT",
        retryAfterSeconds: Math.max(ttl, 1),
      };
    }
  }

  return { allowed: true };
}

/**
 * Check resend cooldown — prevent spamming OTP requests
 */
async function checkResendCooldown(
  phone: string
): Promise<{ allowed: boolean; retryAfterSeconds?: number }> {
  const key = `${REDIS_KEYS.OTP_PREFIX}${phone}`;
  const exists = await redis.exists(key);
  if (exists) {
    const ttl = await redis.ttl(key);
    const elapsed = OTP_CONFIG.EXPIRY_SECONDS - ttl;
    if (elapsed < OTP_CONFIG.RESEND_COOLDOWN_SECONDS) {
      return {
        allowed: false,
        retryAfterSeconds: OTP_CONFIG.RESEND_COOLDOWN_SECONDS - elapsed,
      };
    }
  }
  return { allowed: true };
}

// ==================== CLEANUP ====================

/**
 * Delete OTP for a phone number (used after successful verification or admin action)
 */
export async function deleteOtp(phone: string): Promise<void> {
  await redis.del(`${REDIS_KEYS.OTP_PREFIX}${phone}`);
}
