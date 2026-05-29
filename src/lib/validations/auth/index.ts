/**
 * Purpose: Zod validation schemas for Auth API routes
 * Responsibility: Validate all auth API inputs using shared primitives
 * Important Notes:
 *   - Uses common schemas from validations/common.ts
 *   - One schema per API endpoint
 *   - Export both schema and inferred type
 */

import { z } from "zod";
import { indianMobile, otp6Digit } from "../common";

// ==================== SEND OTP ====================

/** POST /api/auth/send-otp */
export const sendOtpSchema = z.object({
  mobile: indianMobile,
});

export type SendOtpInput = z.infer<typeof sendOtpSchema>;

// ==================== VERIFY OTP ====================

/** POST /api/auth/verify-otp */
export const verifyOtpSchema = z.object({
  mobile: indianMobile,
  otp: otp6Digit,
});

export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>;

// ==================== REFRESH TOKEN ====================

/** POST /api/auth/refresh */
export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, "Refresh token is required"),
});

export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;

// ==================== LOGOUT ====================

/** POST /api/auth/logout — no body, token from header */
export const logoutSchema = z.object({});

export type LogoutInput = z.infer<typeof logoutSchema>;
