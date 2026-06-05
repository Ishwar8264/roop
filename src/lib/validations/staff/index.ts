/**
 * Purpose: Zod validation schemas for Staff API routes
 * Responsibility: Validate all staff API inputs using shared primitives
 * Important Notes:
 *   - Uses common schemas from validations/common.ts
 *   - One schema per API endpoint
 *   - Export both schema and inferred type
 *   - All monetary values as decimal strings
 *   - Time fields as HH:MM strings
 */

import { z } from "zod";
import { cuid, nonEmptyString, decimalString, timeString, pageParam, pageSizeParam } from "../common";

// ==================== CREATE STAFF ====================

/** POST /api/staff */
export const createStaffSchema = z.object({
  userId: cuid,
  branchId: cuid,
  specialization: z.union([
    z.array(nonEmptyString).min(1, "At least one specialization required"),
    nonEmptyString.transform((val) => val.split(",").flatMap(s => { const t = s.trim(); return t ? [t] : []; }))
  ]),
  experienceYears: z.number().int().nonnegative("Experience years must be non-negative").optional(),
  bioHi: nonEmptyString.optional(),
  bioEn: nonEmptyString.optional(),
  workStart: timeString,
  workEnd: timeString,
  commissionRate: decimalString.optional(),
  photoUrl: z.url("Must be a valid URL").optional(),
});

export type CreateStaffInput = z.infer<typeof createStaffSchema>;

// ==================== UPDATE STAFF ====================

/** PATCH /api/staff/[id] — all fields optional (userId is immutable) */
export const updateStaffSchema = z.object({
  branchId: cuid.optional(),
  specialization: z.array(nonEmptyString).min(1, "At least one specialization required").optional(),
  experienceYears: z.number().int().nonnegative("Experience years must be non-negative").optional(),
  bioHi: nonEmptyString.optional(),
  bioEn: nonEmptyString.optional(),
  photoUrl: z.url("Must be a valid URL").optional(),
  workStart: timeString.optional(),
  workEnd: timeString.optional(),
  commissionRate: decimalString.optional(),
  isAvailable: z.boolean().optional(),
});

export type UpdateStaffInput = z.infer<typeof updateStaffSchema>;

// ==================== LIST STAFF QUERY ====================

/** GET /api/staff — query params */
export const listStaffQuerySchema = z.object({
  branchId: cuid.optional(),
  isAvailable: z.enum(["true", "false"]).optional().transform((val) => val === "true" ? true : val === "false" ? false : undefined),
  page: pageParam,
  pageSize: pageSizeParam,
});

export type ListStaffQueryInput = z.infer<typeof listStaffQuerySchema>;

// ==================== LINK SERVICES ====================

/** POST /api/staff/[id]/services */
export const linkStaffServicesSchema = z.object({
  serviceIds: z.array(cuid).min(1, "At least one service ID required"),
});

export type LinkStaffServicesInput = z.infer<typeof linkStaffServicesSchema>;

// ==================== ADD LEAVE ====================

/** POST /api/staff/[id]/leaves */
export const addLeaveSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
  reason: nonEmptyString.optional(),
});

export type AddLeaveInput = z.infer<typeof addLeaveSchema>;
