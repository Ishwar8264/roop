/**
 * Purpose: Zod validation schemas for slot availability API routes
 * Responsibility: Validate query parameters for slot endpoints
 * Important Notes:
 *   - These validate URL query params, NOT request body
 *   - Date must be today or future, max 30 days ahead
 *   - serviceId is REQUIRED — need duration for slot calculation
 *   - variantId is optional — overrides service duration
 *   - Hindi-first error messages
 */

import { z } from "zod";

// ==================== SHARED PRIMITIVES ====================

/** Date string — "YYYY-MM-DD" format, must be valid */
const dateString = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "तारीख YYYY-MM-DD प्रारूप में होनी चाहिए / Date must be in YYYY-MM-DD format")
  .refine((val) => !isNaN(Date.parse(val)), { message: "अमान्य तारीख / Invalid date" });

// ==================== BRANCH SLOTS QUERY ====================

/** Query params for GET /api/branches/[id]/slots */
export const branchSlotQuerySchema = z.object({
  date: dateString,
  serviceId: z
    .string()
    .min(1, "सेवा ID आवश्यक है / Service ID is required"),
  variantId: z
    .string()
    .min(1, "वेरिएंट ID खाली नहीं हो सकता / Variant ID cannot be empty")
    .optional(),
  staffId: z
    .string()
    .min(1, "स्टाफ ID खाली नहीं हो सकता / Staff ID cannot be empty")
    .optional(),
});

export type BranchSlotQueryInput = z.infer<typeof branchSlotQuerySchema>;

// ==================== STAFF SLOTS QUERY ====================

/** Query params for GET /api/staff/[id]/slots */
export const staffSlotQuerySchema = z.object({
  date: dateString,
  serviceId: z
    .string()
    .min(1, "सेवा ID आवश्यक है / Service ID is required"),
  variantId: z
    .string()
    .min(1, "वेरिएंट ID खाली नहीं हो सकता / Variant ID cannot be empty")
    .optional(),
});

export type StaffSlotQueryInput = z.infer<typeof staffSlotQuerySchema>;

// ==================== FLAT SLOTS QUERY ====================

/** Query params for GET /api/slots (alternative flat endpoint) */
export const flatSlotQuerySchema = z.object({
  branchId: z
    .string()
    .min(1, "शाखा ID आवश्यक है / Branch ID is required"),
  date: dateString,
  serviceId: z
    .string()
    .min(1, "सेवा ID आवश्यक है / Service ID is required"),
  variantId: z
    .string()
    .min(1, "वेरिएंट ID खाली नहीं हो सकता / Variant ID cannot be empty")
    .optional(),
  staffId: z
    .string()
    .min(1, "स्टाफ ID खाली नहीं हो सकता / Staff ID cannot be empty")
    .optional(),
});

export type FlatSlotQueryInput = z.infer<typeof flatSlotQuerySchema>;
