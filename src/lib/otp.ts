/**
 * Purpose: OTP generation, hashing, verification, and rate limiting
 * Responsibility: Secure OTP lifecycle management for mobile authentication
 * Important Notes:
 *   - OTP is 6 digits (configurable length)
 *   - OTP is hashed with bcrypt before storing (never store plain OTP)
 *   - Max 3 verification attempts per OTP
 *   - Rate limit: 1 OTP per minute per mobile, 5 per hour
 *   - OTP expires in 5 minutes
 *   - In-memory rate limiting (replace with Redis in production)
 *   - SMS/WhatsApp sending is stubbed — plug real gateway later
 */

import bcrypt from "bcryptjs";

// ==================== CONFIG ====================

const OTP_LENGTH = 6;
const OTP_EXPIRY_MINUTES = 5;
const OTP_MAX_ATTEMPTS = 3;
const OTP_SALT_ROUNDS = 10;

// Rate limiting config
const RATE_LIMIT_PER_MINUTE = 1; // 1 OTP per minute per mobile
const RATE_LIMIT_PER_HOUR = 5; // 5 OTPs per hour per mobile

// ==================== IN-MEMORY RATE LIMITER ====================
// Replace with Redis in production for multi-instance support

interface RateLimitEntry {
  timestamps: number[];
}

const rateLimitStore = new Map<string, RateLimitEntry>();

// Cleanup old entries every 10 minutes to prevent memory leak
setInterval(() => {
  const oneHourAgo = Date.now() - 60 * 60 * 1000;
  for (const [key, entry] of rateLimitStore.entries()) {
    entry.timestamps = entry.timestamps.filter((t) => t > oneHourAgo);
    if (entry.timestamps.length === 0) {
      rateLimitStore.delete(key);
    }
  }
}, 10 * 60 * 1000);

// ==================== OTP GENERATION ====================

/**
 * Generate a random numeric OTP of specified length
 * Returns plain OTP (to send via SMS) — hash before storing
 */
export function generateOtp(length: number = OTP_LENGTH): string {
  const min = Math.pow(10, length - 1); // e.g., 100000 for 6 digits
  const max = Math.pow(10, length) - 1; // e.g., 999999 for 6 digits
  return Math.floor(Math.random() * (max - min + 1) + min).toString();
}

/**
 * Hash OTP using bcrypt — store this hash in AuthOtp table
 * Plain OTP is NEVER stored in database
 */
export async function hashOtp(plainOtp: string): Promise<string> {
  return bcrypt.hash(plainOtp, OTP_SALT_ROUNDS);
}

/**
 * Verify a plain OTP against a bcrypt hash
 * Used during OTP verification step
 */
export async function verifyOtp(
  plainOtp: string,
  hashedOtp: string
): Promise<boolean> {
  return bcrypt.compare(plainOtp, hashedOtp);
}

// ==================== RATE LIMITING ====================

export interface RateLimitResult {
  allowed: boolean;
  reason?: string;
  retryAfterSeconds?: number;
}

/**
 * Check if a mobile number can request a new OTP
 * Prevents spam and abuse
 */
export function checkRateLimit(mobile: string): RateLimitResult {
  const now = Date.now();
  const oneMinuteAgo = now - 60 * 1000;
  const oneHourAgo = now - 60 * 60 * 1000;

  let entry = rateLimitStore.get(mobile);
  if (!entry) {
    entry = { timestamps: [] };
    rateLimitStore.set(mobile, entry);
  }

  // Filter to only recent timestamps
  entry.timestamps = entry.timestamps.filter((t) => t > oneHourAgo);

  // Check per-minute limit
  const requestsInLastMinute = entry.timestamps.filter(
    (t) => t > oneMinuteAgo
  ).length;
  if (requestsInLastMinute >= RATE_LIMIT_PER_MINUTE) {
    const oldestInMinute = entry.timestamps.find((t) => t > oneMinuteAgo)!;
    const retryAfter = Math.ceil((oldestInMinute + 60000 - now) / 1000);
    return {
      allowed: false,
      reason: "OTP_ALREADY_SENT",
      retryAfterSeconds: retryAfter,
    };
  }

  // Check per-hour limit
  if (entry.timestamps.length >= RATE_LIMIT_PER_HOUR) {
    const oldestInHour = entry.timestamps[0];
    const retryAfter = Math.ceil((oldestInHour + 3600000 - now) / 1000);
    return {
      allowed: false,
      reason: "HOURLY_LIMIT_EXCEEDED",
      retryAfterSeconds: retryAfter,
    };
  }

  return { allowed: true };
}

/**
 * Record that an OTP was sent to this mobile number
 * Call AFTER successfully sending OTP
 */
export function recordOtpSent(mobile: string): void {
  const entry = rateLimitStore.get(mobile) || { timestamps: [] };
  entry.timestamps.push(Date.now());
  rateLimitStore.set(mobile, entry);
}

// ==================== OTP EXPIRY ====================

/**
 * Get the expiry time for a new OTP (5 minutes from now)
 */
export function getOtpExpiry(): Date {
  const expiry = new Date();
  expiry.setMinutes(expiry.getMinutes() + OTP_EXPIRY_MINUTES);
  return expiry;
}

/**
 * Check if an OTP has expired
 */
function _isOtpExpired(expiresAt: Date): boolean {
  return new Date() > expiresAt;
}

/**
 * Get max attempts allowed for OTP verification
 */
export function getMaxAttempts(): number {
  return OTP_MAX_ATTEMPTS;
}

// ==================== SMS GATEWAY STUB ====================

/**
 * Send OTP via SMS/WhatsApp gateway
 * Currently STUB — returns success without sending
 * Replace with real gateway (MSG91, Twilio, WhatsApp Business API)
 *
 * @param mobile - 10-digit Indian mobile number
 * @param otp - 6-digit OTP
 * @param purpose - LOGIN | REGISTER | RESET
 */
export async function sendOtpSms(
  mobile: string,
  otp: string,
  purpose: "LOGIN" | "REGISTER" | "RESET"
): Promise<{ success: boolean; messageId?: string }> {
  // TODO: Replace with real SMS gateway integration
  // Example integrations:
  //   - MSG91: https://docs.msg91.com
  //   - Twilio: https://www.twilio.com/docs/sms
  //   - WhatsApp Business API: https://developers.facebook.com/docs/whatsapp

  // Only log OTP in development — NEVER in production
  if (process.env.NODE_ENV === "development") {
    console.warn(
      `[OTP STUB] Sending OTP ${otp} to ${mobile} for purpose: ${purpose}`
    );
  }

  // Simulate async SMS gateway call
  return {
    success: true,
    messageId: `stub_${Date.now()}_${mobile}`,
  };
}
