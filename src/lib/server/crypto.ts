/**
 * Purpose: Cryptographic utility functions
 * Responsibility: All crypto operations centralized — no duplication
 * Important Notes:
 *   - Uses Web Crypto API — works in Edge Runtime
 *   - SHA-256 for token hashing (session lookup)
 *   - bcrypt for OTP hashing (verification)
 *   - nanoid for generating unique IDs (token families)
 */

import bcrypt from "bcryptjs";
import { nanoid } from "nanoid";

// ==================== SHA-256 (Web Crypto API) ====================

/**
 * Hash a token using SHA-256 — for storing session token hashes in DB
 * Used for refresh token hash lookup (not for password/OTP — use bcrypt for those)
 */
export async function hashTokenSha256(token: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(token);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

// ==================== BCRYPT (OTP) ====================

const OTP_SALT_ROUNDS = 10;
const PASSWORD_SALT_ROUNDS = 12;

/**
 * Hash OTP using bcrypt — store this hash in VerificationToken table
 * Plain OTP is NEVER stored in database or logs
 */
export async function hashOtp(plainOtp: string): Promise<string> {
  return bcrypt.hash(plainOtp, OTP_SALT_ROUNDS);
}

/**
 * Verify a plain OTP against a bcrypt hash
 */
export async function verifyOtpHash(
  plainOtp: string,
  hashedOtp: string
): Promise<boolean> {
  return bcrypt.compare(plainOtp, hashedOtp);
}

/**
 * Hash password using bcrypt — store in User table
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, PASSWORD_SALT_ROUNDS);
}

/**
 * Verify a plain password against a bcrypt hash
 */
export async function verifyPasswordHash(
  plainPassword: string,
  hashedPassword: string
): Promise<boolean> {
  return bcrypt.compare(plainPassword, hashedPassword);
}

// ==================== ID GENERATION ====================

/**
 * Generate a unique token family ID for refresh token rotation
 * Used to detect token reuse across a chain of rotated tokens
 */
export function generateTokenFamily(): string {
  return nanoid(32);
}

/**
 * Generate a magic link token
 */
export function generateMagicLinkToken(): string {
  return nanoid(48);
}

/**
 * Generate a secure OTP (6 digits, crypto-safe)
 * Uses Web Crypto API getRandomValues — works in Edge Runtime + Node.js
 */
export function generateOtp(length: number = 6): string {
  const max = Math.pow(10, length);
  const array = new Uint32Array(1);
  crypto.getRandomValues(array);
  // Generate a number in range [10^(length-1), 10^length - 1]
  const min = Math.pow(10, length - 1);
  const value = (array[0] % (max - min)) + min;
  return value.toString();
}
