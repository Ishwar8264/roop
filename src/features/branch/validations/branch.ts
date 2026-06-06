/**
 * Purpose: Zod validation schemas for branch API routes
 * Responsibility: Validate all branch and holiday API inputs
 * Important Notes:
 *   - One schema per API endpoint
 *   - Export both schema and inferred type
 *   - Shared primitives imported from auth primitives — DRY
 *   - Time strings validated as "HH:mm" format
 */

import { z } from "zod";
import { indianPhone } from "@/features/auth/validations/primitives";

// ==================== SHARED PRIMITIVES ====================

/** Time string — "HH:mm" format (24-hour) */
const timeString = z
  .string()
  .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Time must be in HH:mm format (e.g., 09:00)");

/** Date string — "YYYY-MM-DD" format */
const dateString = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format")
  .refine((val) => !isNaN(Date.parse(val)), { message: "Invalid date" });

// ==================== CREATE BRANCH ====================

/** POST /api/branches */
const _createBranchSchema = z
  .object({
    nameHi: z
      .string()
      .min(1, "शाखा का नाम (हिंदी) आवश्यक है")
      .max(200, "नाम 200 अक्षरों से कम होना चाहिए")
      .trim(),
    nameEn: z
      .string()
      .min(1, "Branch name (English) is required")
      .max(200, "Name must be under 200 characters")
      .trim(),
    city: z
      .string()
      .min(1, "शहर आवश्यक है")
      .max(100, "City must be under 100 characters")
      .trim(),
    address: z
      .string()
      .min(1, "पता आवश्यक है")
      .max(500, "Address must be under 500 characters")
      .trim(),
    latitude: z.number().min(-90).max(90).optional(),
    longitude: z.number().min(-180).max(180).optional(),
    googleMapsUrl: z
      .url("Invalid Google Maps URL")
      .nullable()
      .optional(),
    phone: indianPhone,
    openTime: timeString,
    closeTime: timeString,
  })
  .refine((data) => data.openTime < data.closeTime, {
    message: "खुलने का समय बंद होने के समय से पहले होना चाहिए / Open time must be before close time",
    path: ["openTime"],
  });

export type CreateBranchInput = z.infer<typeof _createBranchSchema>;

// ==================== UPDATE BRANCH ====================

/** PATCH /api/branches/[id] */
const _updateBranchSchema = z
  .object({
    nameHi: z
      .string()
      .min(1, "शाखा का नाम (हिंदी) आवश्यक है")
      .max(200, "नाम 200 अक्षरों से कम होना चाहिए")
      .trim()
      .optional(),
    nameEn: z
      .string()
      .min(1, "Branch name (English) is required")
      .max(200, "Name must be under 200 characters")
      .trim()
      .optional(),
    city: z
      .string()
      .min(1, "शहर आवश्यक है")
      .max(100, "City must be under 100 characters")
      .trim()
      .optional(),
    address: z
      .string()
      .min(1, "पता आवश्यक है")
      .max(500, "Address must be under 500 characters")
      .trim()
      .optional(),
    latitude: z.number().min(-90).max(90).nullable().optional(),
    longitude: z.number().min(-180).max(180).nullable().optional(),
    googleMapsUrl: z
      .url("Invalid Google Maps URL")
      .nullable()
      .optional(),
    phone: indianPhone.optional(),
    openTime: timeString.optional(),
    closeTime: timeString.optional(),
  })
  .refine(
    (data) => {
      // Only validate open/close time if both are provided
      if (data.openTime && data.closeTime) {
        return data.openTime < data.closeTime;
      }
      return true;
    },
    {
      message: "खुलने का समय बंद होने के समय से पहले होना चाहिए / Open time must be before close time",
      path: ["openTime"],
    }
  );

export type UpdateBranchInput = z.infer<typeof _updateBranchSchema>;

// ==================== ADD HOLIDAY ====================

/** POST /api/branches/[id]/holidays */
const _addHolidaySchema = z.object({
  date: dateString,
  reasonHi: z
    .string()
    .min(1, "छुट्टी का कारण (हिंदी) आवश्यक है")
    .max(200, "कारण 200 अक्षरों से कम होना चाहिए")
    .trim(),
  reasonEn: z
    .string()
    .max(200, "Reason must be under 200 characters")
    .trim()
    .optional(),
});

export type AddHolidayInput = z.infer<typeof _addHolidaySchema>;

// ==================== TOGGLE ACTIVE ====================

/** PATCH /api/branches/[id]/toggle-active — no body needed */
export const toggleActiveSchema = z.object({});

export type ToggleActiveInput = z.infer<typeof toggleActiveSchema>;
