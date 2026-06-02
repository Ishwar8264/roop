/**
 * Purpose: Login rate limiting service — prevent brute force attacks
 * Responsibility: Track failed login attempts and enforce lockouts
 * Important Notes:
 *   - Per-identifier (email/phone) rate limiting
 *   - 5 failed attempts → 15 minute lockout
 *   - Rate limit data stored in Redis with auto-expiry
 *   - Used by email login, phone OTP verify, and Google auth
 */

import { redis } from "@/lib/config/redis";
import { RATE_LIMIT_CONFIG, REDIS_KEYS } from "@/lib/config/auth";
import { AuthLoginLockedError } from "@/lib/server/errors";

// ==================== TYPES ====================

interface LoginRateData {
  count: number;
  lockedUntil: number | null; // Unix timestamp ms, null = not locked
}

// ==================== CHECK LOGIN RATE ====================

/**
 * Check if a login attempt is allowed for the given identifier
 * Throws AuthLoginLockedError if locked out
 */
export async function checkLoginRateLimit(
  identifier: string
): Promise<void> {
  const key = `${REDIS_KEYS.LOGIN_RATE_PREFIX}${identifier}`;
  const raw = await redis.get(key);

  if (!raw) return; // No failed attempts — allow

  const data: LoginRateData = JSON.parse(raw);

  // Check if locked out
  if (data.lockedUntil && Date.now() < data.lockedUntil) {
    const retryAfterSeconds = Math.ceil(
      (data.lockedUntil - Date.now()) / 1000
    );
    throw new AuthLoginLockedError(retryAfterSeconds);
  }
}

// ==================== RECORD FAILED ATTEMPT ====================

/**
 * Record a failed login attempt
 * After MAX_ATTEMPTS, lock the identifier for LOCKOUT_SECONDS
 */
export async function recordFailedLogin(identifier: string): Promise<void> {
  const key = `${REDIS_KEYS.LOGIN_RATE_PREFIX}${identifier}`;
  const raw = await redis.get(key);

  let data: LoginRateData = raw
    ? JSON.parse(raw)
    : { count: 0, lockedUntil: null };

  data.count += 1;

  if (data.count >= RATE_LIMIT_CONFIG.LOGIN_MAX_ATTEMPTS) {
    data.lockedUntil = Date.now() + RATE_LIMIT_CONFIG.LOGIN_LOCKOUT_SECONDS * 1000;
  }

  // Store with 1 hour TTL (lockouts longer than 1 hour get auto-cleaned)
  await redis.setex(key, 3600, JSON.stringify(data));
}

// ==================== RECORD SUCCESSFUL LOGIN ====================

/**
 * Clear failed login attempts after a successful login
 */
export async function recordSuccessfulLogin(
  identifier: string
): Promise<void> {
  const key = `${REDIS_KEYS.LOGIN_RATE_PREFIX}${identifier}`;
  await redis.del(key);
}
