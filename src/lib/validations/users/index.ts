/**
 * Purpose: Zod validation schemas for User Profile features
 * Responsibility: Validate all inputs for user profile, password change, and admin user management
 * Important Notes:
 *   - updateProfileSchema: user updates own profile (name, email, avatarUrl)
 *   - changePasswordSchema: user changes own password (current + new)
 *   - adminUpdateUserSchema: admin updates any user (name, email, role, isActive, branchId)
 *   - Password rules: min 8 chars, 1 uppercase, 1 lowercase, 1 digit
 *   - Uses common primitives from @/lib/validations/common
 */

import { z } from "zod";
import {
  fullName,
  email,
  password,
  nonEmptyString,
} from "../common";

// ==================== PROFILE SCHEMAS ====================

/** User updates own profile */
export const updateProfileSchema = z.object({
  name: fullName.optional(),
  email: email.optional(),
  avatarUrl: z.url("Invalid avatar URL").optional(),
});

/** User changes own password */
export const changePasswordSchema = z
  .object({
    currentPassword: nonEmptyString,
    newPassword: password,
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: "New password must be different from current password",
    path: ["newPassword"],
  });

// ==================== ADMIN USER SCHEMAS ====================

/** Admin updates any user's data */
export const adminUpdateUserSchema = z.object({
  name: fullName.optional(),
  email: email.optional(),
  role: z.enum(["GUEST", "USER", "STAFF", "ADMIN"]).optional(),
  isActive: z.boolean().optional(),
  branchId: z.string().min(1, "Branch ID is required").nullable().optional(),
});

// ==================== TYPE EXPORTS ====================

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type AdminUpdateUserInput = z.infer<typeof adminUpdateUserSchema>;
