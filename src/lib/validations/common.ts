/**
 * Purpose: Common/shared Zod validation schemas used across features
 * Responsibility: Reusable validation primitives for all API routes
 * Important Notes:
 *   - Import from here — don't redefine common schemas in feature files
 *   - Indian mobile: 10 digits, starts with 6-9
 *   - CUID: Prisma default ID format
 */

import { z } from "zod";

// ==================== PRIMITIVES ====================

/** Indian mobile number — 10 digits starting with 6-9 */
export const indianMobile = z
  .string()
  .regex(/^[6-9]\d{9}$/, "Invalid Indian mobile number — must be 10 digits starting with 6-9");

/** 6-digit OTP */
export const otp6Digit = z
  .string()
  .regex(/^\d{6}$/, "OTP must be exactly 6 digits");

/** CUID format (Prisma default ID) */
export const cuid = z
  .string()
  .min(1, "ID is required");

/** Positive integer */
export const positiveInt = z
  .number()
  .int()
  .positive();

/** Non-empty string */
export const nonEmptyString = z
  .string()
  .min(1, "This field is required");

/** Decimal string (for money) */
export const decimalString = z
  .string()
  .regex(/^\d+(\.\d{1,2})?$/, "Must be a valid decimal number (e.g., 500.00)");

/** Date string (YYYY-MM-DD) */
export const dateString = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format");

/** Time string (HH:MM) */
export const timeString = z
  .string()
  .regex(/^\d{2}:\d{2}$/, "Time must be in HH:MM format");

/** Slug (URL-safe identifier) */
export const slug = z
  .string()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Must be a valid slug (lowercase, hyphens, no spaces)");

/** Pagination page number */
export const pageParam = z.coerce.number().int().positive().default(1);

/** Pagination page size */
export const pageSizeParam = z.coerce.number().int().positive().max(100).default(20);

/** Email address */
export const email = z
  .email("Invalid email address");

/** Password — min 8 chars, at least 1 uppercase, 1 lowercase, 1 digit */
export const password = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/\d/, "Password must contain at least one digit");

/** Name — non-empty, max 100 chars */
export const fullName = z
  .string()
  .min(1, "Name is required")
  .max(100, "Name must be less than 100 characters");

/** Google ID token */
export const googleIdToken = z
  .string()
  .min(1, "Google ID token is required");
