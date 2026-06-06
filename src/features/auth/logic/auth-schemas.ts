/**
 * Purpose: Shared Zod schemas + types for auth forms
 * Responsibility: Define all validation schemas in one place
 * Important Notes:
 *   - Used by login-handlers, register-handlers, and form components
 *   - Single source of truth for validation rules
 */

import { z } from "zod";
import type { UserProfile } from "@/types";

// ==================== Primitives ====================

const indianMobile = z
  .string()
  .min(1, "Mobile number is required")
  .regex(/^[6-9]\d{9}$/, "Must be 10 digits starting with 6-9");

const fullName = z
  .string()
  .min(1, "Name is required")
  .max(100, "Name too long")
  .trim();

const otp6 = z
  .string()
  .min(1, "OTP is required")
  .regex(/^\d{6}$/, "OTP must be exactly 6 digits");

const emailField = z
  .string()
  .min(1, "Email is required")
  .email("Enter a valid email");

const passwordField = z
  .string()
  .min(1, "Password is required");

const usernameField = z
  .string()
  .min(3, "Username must be at least 3 characters")
  .max(30, "Username too long")
  .regex(/^[a-zA-Z0-9_]+$/, "Only letters, numbers, and underscores");

const registerPassword = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[A-Z]/, "Must contain at least 1 uppercase letter")
  .regex(/[a-z]/, "Must contain at least 1 lowercase letter")
  .regex(/\d/, "Must contain at least 1 digit");

// ==================== Form Schemas ====================

export const otpSendSchema = z.object({
  mobile: indianMobile,
});

/** Email OTP send schema — for login via email OTP */
export const emailOtpSendSchema = z.object({
  email: emailField,
});

/** OTP verify schema — works for both mobile & email OTP */
export const otpVerifySchema = z.object({
  mobile: z.string().optional(),
  email: z.string().optional(),
  otp: otp6,
}).refine((data) => data.mobile || data.email, {
  message: "Either mobile or email is required",
  path: ["mobile"],
});

export const emailLoginSchema = z.object({
  email: emailField,
  password: passwordField,
});

export const registerDetailsSchema = z.object({
  name: fullName,
  username: usernameField,
  email: emailField,
  password: registerPassword,
  confirmPassword: z.string().min(1, "Confirm password is required"),
  mobile: indianMobile,
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export const registerOtpSchema = z.object({
  mobile: z.string(),
  otp: otp6,
});

// ==================== Inferred Types ====================

export type OtpSendForm = z.infer<typeof otpSendSchema>;
export type EmailOtpSendForm = z.infer<typeof emailOtpSendSchema>;
export type OtpVerifyForm = z.infer<typeof otpVerifySchema>;
export type EmailLoginForm = z.infer<typeof emailLoginSchema>;
export type RegisterDetailsForm = z.infer<typeof registerDetailsSchema>;
export type RegisterOtpForm = z.infer<typeof registerOtpSchema>;

// ==================== Callback Types ====================

export interface LoginSuccessData {
  user: UserProfile;
  isNewUser?: boolean;
}

export interface RegisterSuccessData {
  user: UserProfile;
}
