/**
 * Purpose: Zod validation schemas for user management API routes
 * Responsibility: Validate all user API inputs
 * Important Notes:
 *   - One schema per API endpoint
 *   - Shared primitives imported from auth/primitives.ts — DRY
 */

import { z } from "zod";
import { indianPhone, otp6, email, password, fullName } from "@/features/auth/validations/primitives";

// ==================== FORGOT PASSWORD ====================

/** POST /api/auth/forgot-password */
export const forgotPasswordSchema = z.object({
  email: email,
});

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

// ==================== RESET PASSWORD ====================

/** POST /api/auth/reset-password */
export const resetPasswordSchema = z.object({
  token: z.string().min(1, "Reset token is required"),
  password: password,
});

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

// ==================== CHANGE PASSWORD ====================

/** POST /api/auth/change-password — for logged-in users */
export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: password,
}).refine(data => data.currentPassword !== data.newPassword, {
  message: "New password must be different from current password",
  path: ["newPassword"],
});

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

// ==================== UPDATE PROFILE ====================

/** PATCH /api/user/profile */
export const updateProfileSchema = z.object({
  name: fullName.optional(),
  email: email.optional(),
  phone: indianPhone.optional(),
  avatarUrl: z.url("Invalid avatar URL").optional(),
}).refine(
  data => data.name !== undefined || data.email !== undefined || data.phone !== undefined || data.avatarUrl !== undefined,
  { message: "At least one field must be provided for update" }
);

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

// ==================== VERIFY EMAIL ====================

/** POST /api/user/verify-email — resend verification email */
export const resendVerificationSchema = z.object({
  email: email.optional(),
});

export type ResendVerificationInput = z.infer<typeof resendVerificationSchema>;

/** POST /api/user/verify-email/confirm — verify with OTP */
export const verifyEmailOtpSchema = z.object({
  otp: otp6,
});

export type VerifyEmailOtpInput = z.infer<typeof verifyEmailOtpSchema>;

// ==================== CHANGE PHONE ====================

/** POST /api/user/change-phone — Step 1: Send OTP to new number */
export const changePhoneSchema = z.object({
  newPhone: indianPhone,
});

export type ChangePhoneInput = z.infer<typeof changePhoneSchema>;

/** POST /api/user/change-phone/verify — Step 2: Verify OTP and update */
export const verifyChangePhoneSchema = z.object({
  newPhone: indianPhone,
  otp: otp6,
});

export type VerifyChangePhoneInput = z.infer<typeof verifyChangePhoneSchema>;

// ==================== DEACTIVATE ACCOUNT ====================

/** POST /api/user/deactivate */
export const deactivateAccountSchema = z.object({
  reason: z.string().max(500, "Reason must be less than 500 characters").optional(),
  confirmation: z.literal("DELETE_MY_ACCOUNT", {
    message: 'Please type "DELETE_MY_ACCOUNT" to confirm',
  }),
});

export type DeactivateAccountInput = z.infer<typeof deactivateAccountSchema>;
