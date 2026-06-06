/**
 * Purpose: Shared Zod validation primitives — DRY
 * Responsibility: Single source of truth for all validation primitives
 * Important Notes:
 *   - Import from here instead of defining locally in auth.ts / user.ts
 *   - One change reflects everywhere — no divergent validation rules
 */

import { z } from "zod";

/** Indian phone number — 10 digits starting with 6-9 */
export const indianPhone = z
  .string()
  .regex(/^[6-9]\d{9}$/, "Invalid Indian phone number — must be 10 digits starting with 6-9");

/** 6-digit OTP */
export const otp6 = z
  .string()
  .regex(/^\d{6}$/, "OTP must be exactly 6 digits");

/** Email address — normalized to lowercase + trimmed */
export const email = z
  .email("Invalid email address")
  .toLowerCase()
  .trim();

/** Password — min 8, max 72 (bcrypt limit), uppercase, lowercase, digit, special char */
export const password = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(72, "Password must be at most 72 characters")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/\d/, "Password must contain at least one digit")
  .regex(/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/, "Password must contain at least one special character");

/** Name — non-empty, max 100 chars */
export const fullName = z
  .string()
  .min(1, "Name is required")
  .max(100, "Name must be less than 100 characters")
  .trim();

/** Google ID token */
export const googleIdToken = z
  .string()
  .min(1, "Google ID token is required");
