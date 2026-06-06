/**
 * Purpose: Zod validation schemas for auth API routes
 * Responsibility: Validate all auth API inputs
 * Important Notes:
 *   - One schema per API endpoint
 *   - Export both schema and inferred type
 *   - Shared primitives imported from primitives.ts — DRY
 */

import { z } from "zod";
import { indianPhone, otp6, email, password, fullName, googleIdToken } from "./primitives";

// ==================== SEND OTP ====================

/** POST /api/auth/send-otp */
const _sendOtpSchema = z.object({
  phone: indianPhone,
});

export type SendOtpInput = z.infer<typeof _sendOtpSchema>;

// ==================== VERIFY OTP ====================

/** POST /api/auth/verify-otp */
const _verifyOtpSchema = z.object({
  phone: indianPhone,
  otp: otp6,
});

export type VerifyOtpInput = z.infer<typeof _verifyOtpSchema>;

// ==================== REGISTER EMAIL ====================

/** POST /api/auth/register-email */
const _registerEmailSchema = z.object({
  name: fullName,
  email: email,
  password: password,
  phone: indianPhone.optional(),
});

export type RegisterEmailInput = z.infer<typeof _registerEmailSchema>;

// ==================== LOGIN EMAIL ====================

/** POST /api/auth/login-email */
const _loginEmailSchema = z.object({
  email: email,
  password: z.string().min(1, "Password is required").max(72, "Password too long"),
});

export type LoginEmailInput = z.infer<typeof _loginEmailSchema>;

// ==================== MAGIC LINK ====================

/** POST /api/auth/magic-link */
export const magicLinkSchema = z.object({
  email: email,
});

export type MagicLinkInput = z.infer<typeof magicLinkSchema>;

// ==================== VERIFY MAGIC LINK ====================

/** GET /api/auth/verify-magic-link?token=xxx */
const _verifyMagicLinkSchema = z.object({
  token: z.string().min(1, "Magic link token is required"),
});

export type VerifyMagicLinkInput = z.infer<typeof _verifyMagicLinkSchema>;

// ==================== GOOGLE AUTH ====================

/** POST /api/auth/google */
const _googleAuthSchema = z.object({
  idToken: googleIdToken,
});

export type GoogleAuthInput = z.infer<typeof _googleAuthSchema>;

// ==================== REVOKE SESSION ====================

/** POST /api/auth/revoke-session */
export const revokeSessionSchema = z.object({
  sessionId: z.string().min(1, "Session ID is required"),
});

export type RevokeSessionInput = z.infer<typeof revokeSessionSchema>;
