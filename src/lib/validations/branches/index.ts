/**
 * Purpose: Zod validation schemas for Branch and BranchHoliday features
 * Responsibility: Validate all inputs for branch CRUD and holiday management
 * Important Notes:
 *   - nameHi/nameEn: bilingual names (Hindi-first pattern)
 *   - phone: Indian 10-digit format
 *   - openTime/closeTime: HH:MM format (stored as @db.Time in Prisma)
 *   - date: YYYY-MM-DD format for holidays
 *   - Uses common primitives from @/lib/validations/common
 */

import { z } from "zod";
import {
  nonEmptyString,
  timeString,
  dateString,
  pageParam,
  pageSizeParam,
} from "../common";

// ==================== BRANCH SCHEMAS ====================

/** Create a new branch */
export const createBranchSchema = z.object({
  nameHi: nonEmptyString.max(200, "Hindi name must be less than 200 characters"),
  nameEn: nonEmptyString.max(200, "English name must be less than 200 characters"),
  city: nonEmptyString.max(100, "City must be less than 100 characters"),
  address: nonEmptyString.max(500, "Address must be less than 500 characters"),
  googleMapsUrl: z.url("Invalid Google Maps URL").optional(),
  phone: z
    .string()
    .regex(/^[6-9]\d{9}$/, "Phone must be 10 digits starting with 6-9"),
  openTime: timeString,
  closeTime: timeString,
});

/** Update an existing branch — all fields optional */
export const updateBranchSchema = z.object({
  nameHi: nonEmptyString.max(200, "Hindi name must be less than 200 characters").optional(),
  nameEn: nonEmptyString.max(200, "English name must be less than 200 characters").optional(),
  city: nonEmptyString.max(100, "City must be less than 100 characters").optional(),
  address: nonEmptyString.max(500, "Address must be less than 500 characters").optional(),
  googleMapsUrl: z.url("Invalid Google Maps URL").nullable().optional(),
  phone: z
    .string()
    .regex(/^[6-9]\d{9}$/, "Phone must be 10 digits starting with 6-9")
    .optional(),
  openTime: timeString.optional(),
  closeTime: timeString.optional(),
});

/** Query params for listing branches */
export const listBranchesQuerySchema = z.object({
  city: z.string().max(100).optional(),
  isActive: z
    .enum(["true", "false"])
    .transform((v) => v === "true")
    .optional(),
  page: pageParam,
  pageSize: pageSizeParam,
});

// ==================== HOLIDAY SCHEMAS ====================

/** Create a branch holiday */
export const createHolidaySchema = z.object({
  date: dateString,
  reasonHi: nonEmptyString.max(200, "Hindi reason must be less than 200 characters"),
  reasonEn: z.string().max(200, "English reason must be less than 200 characters").optional(),
});

// ==================== TYPE EXPORTS ====================

export type CreateBranchInput = z.infer<typeof createBranchSchema>;
export type UpdateBranchInput = z.infer<typeof updateBranchSchema>;
export type ListBranchesQuery = z.infer<typeof listBranchesQuerySchema>;
export type CreateHolidayInput = z.infer<typeof createHolidaySchema>;
