/**
 * Purpose: Zod validation schemas for Nikharta Roop Auth API routes
 * Responsibility: Validate all auth API inputs before processing
 * Important Notes:
 *   - Every API route MUST validate input with these schemas — never trust raw body
 *   - Schemas are reusable — same schema for API and future form validation
 *   - Indian mobile validation: 10 digits, starts with 6-9
 *   - OTP validation: exactly 6 digits
 */

import { z } from "zod";

// ==================== COMMON ====================

/**
 * Indian mobile number validation
 * - Must be 10 digits
 * - Must start with 6, 7, 8, or 9 (Indian mobile numbering)
 */
export const indianMobileSchema = z
  .string()
  .regex(/^[6-9]\d{9}$/, "Invalid Indian mobile number — must be 10 digits starting with 6-9");

/**
 * 6-digit OTP validation
 */
export const otpSchema = z
  .string()
  .regex(/^\d{6}$/, "OTP must be exactly 6 digits");

// ==================== SEND OTP ====================

/**
 * POST /api/auth/send-otp
 * Body: { mobile: "9876543210" }
 */
export const sendOtpSchema = z.object({
  mobile: indianMobileSchema,
});

export type SendOtpInput = z.infer<typeof sendOtpSchema>;

// ==================== VERIFY OTP ====================

/**
 * POST /api/auth/verify-otp
 * Body: { mobile: "9876543210", otp: "123456" }
 */
export const verifyOtpSchema = z.object({
  mobile: indianMobileSchema,
  otp: otpSchema,
});

export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>;

// ==================== REFRESH TOKEN ====================

/**
 * POST /api/auth/refresh
 * Body: { refreshToken: "eyJhbGciOi..." }
 */
export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, "Refresh token is required"),
});

export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;

// ==================== LOGOUT ====================

/**
 * POST /api/auth/logout
 * Body: {} (empty — uses Authorization header)
 * No body validation needed — token from header
 */
export const logoutSchema = z.object({});

export type LogoutInput = z.infer<typeof logoutSchema>;

// ==================== LOGIN EMAIL ====================

/**
 * POST /api/auth/login-email
 * Body: { email: string, password: string }
 */
export const loginEmailSchema = z.object({
  email: z.string().email("Valid email is required"),
  password: z.string().min(1, "Password is required"),
});

export type LoginEmailInput = z.infer<typeof loginEmailSchema>;

// ==================== REGISTER EMAIL ====================

/**
 * POST /api/auth/register-email
 * Body: { name, email, password, mobile? }
 */
export const registerEmailSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name too long"),
  email: z.string().email("Valid email is required"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Must contain at least 1 uppercase letter")
    .regex(/[a-z]/, "Must contain at least 1 lowercase letter")
    .regex(/\d/, "Must contain at least 1 digit"),
  mobile: indianMobileSchema.optional(),
});

export type RegisterEmailInput = z.infer<typeof registerEmailSchema>;

// ==================== GOOGLE AUTH ====================

/**
 * POST /api/auth/google
 * Body: { idToken: string }
 */
export const googleAuthSchema = z.object({
  idToken: z.string().min(1, "Google ID token is required"),
});

export type GoogleAuthInput = z.infer<typeof googleAuthSchema>;
