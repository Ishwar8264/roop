/**
 * Purpose: Zod validation schemas for Nikharta Roop Auth API routes
 * Responsibility: Validate all auth API inputs before processing
 * Important Notes:
 *   - Every API route MUST validate input with these schemas — never trust raw body
 *   - Schemas are reusable — same schema for API and future form validation
 *   - Indian mobile validation: 10 digits, starts with 6-9
 *   - OTP validation: exactly 6 digits
 *   - Purpose field: LOGIN or REGISTER — controls DB checks and auto-registration
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

/**
 * OTP purpose enum — LOGIN = only existing users, REGISTER = new user creation
 */
export const otpPurposeSchema = z.enum(["LOGIN", "REGISTER"]);

// ==================== SEND OTP ====================

/**
 * POST /api/auth/send-otp
 * Body: { mobile?: "9876543210", email?: "user@example.com", purpose: "LOGIN" | "REGISTER" }
 *
 * - At least one of mobile or email must be provided
 * - LOGIN: checks mobile/email exists in DB (user must be registered)
 * - REGISTER: checks mobile does NOT exist in DB (must be new)
 */
export const sendOtpSchema = z.object({
  mobile: indianMobileSchema.optional(),
  email: z.email("Valid email is required").optional(),
  purpose: otpPurposeSchema.default("LOGIN"),
}).refine(
  (data) => data.mobile || data.email,
  { message: "Either mobile or email is required", path: ["mobile"] }
);

export type SendOtpInput = z.infer<typeof sendOtpSchema>;

// ==================== VERIFY OTP ====================

/**
 * POST /api/auth/verify-otp
 * Body: { mobile: "9876543210", otp: "123456", purpose: "LOGIN" | "REGISTER", name?: string }
 *
 * - LOGIN: verifies OTP and logs in existing user (no auto-registration)
 * - REGISTER: verifies OTP, creates new user with provided name, then logs in
 * - name is required when purpose is REGISTER
 */
export const verifyOtpSchema = z.object({
  mobile: indianMobileSchema.optional(),
  email: z.email("Valid email is required").optional(),
  otp: otpSchema,
  purpose: otpPurposeSchema.default("LOGIN"),
  name: z.string().min(1, "Name is required").max(100, "Name too long").optional(),
  username: z.string().min(3, "Username must be at least 3 characters").max(30, "Username too long").regex(/^[a-zA-Z0-9_]+$/, "Only letters, numbers, and underscores").optional(),
  password: z.string().min(8, "Password must be at least 8 characters").optional(),
}).refine(
  (data) => data.mobile || data.email,
  { message: "Either mobile or email is required", path: ["mobile"] }
).refine(
  (data) => data.purpose !== "REGISTER" || (data.name && data.name.trim().length > 0),
  { message: "Name is required for registration", path: ["name"] }
);

export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>;

// ==================== REFRESH TOKEN ====================

/**
 * POST /api/auth/refresh
 * Body: { refreshToken?: "eyJhbGciOi..." }
 * Fallback: reads from HttpOnly cookie (nr_refresh_token) if body is empty
 */
export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, "Refresh token is required").optional(),
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
  email: z.email("Valid email is required"),
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
  email: z.email("Valid email is required"),
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
