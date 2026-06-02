/**
 * Purpose: Zod validation schemas for booking lifecycle API routes
 * Responsibility: Validate request bodies for booking endpoints
 * Important Notes:
 *   - Create booking: validates service, branch, date, slot, and optional add-ons/offer
 *   - Cancel booking: requires cancellation reason
 *   - Status transitions (confirm, start, complete, no-show): no body required
 *   - Hindi-first error messages
 */

import { z } from "zod";

// ==================== SHARED PRIMITIVES ====================

/** Date string — "YYYY-MM-DD" format, must be valid */
const dateString = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "तारीख YYYY-MM-DD प्रारूप में होनी चाहिए / Date must be in YYYY-MM-DD format")
  .refine((val) => !isNaN(Date.parse(val)), { message: "अमान्य तारीख / Invalid date" });

/** Time string — "HH:mm" format */
const timeString = z
  .string()
  .regex(/^\d{2}:\d{2}$/, "समय HH:mm प्रारूप में होना चाहिए / Time must be in HH:mm format");

// ==================== CREATE BOOKING ====================

/** Body for POST /api/bookings */
export const createBookingSchema = z.object({
  serviceId: z
    .string()
    .min(1, "सेवा ID आवश्यक है / Service ID is required"),
  variantId: z
    .string()
    .min(1, "वेरिएंट ID खाली नहीं हो सकती / Variant ID cannot be empty")
    .optional(),
  staffId: z
    .string()
    .min(1, "स्टाफ ID खाली नहीं हो सकता / Staff ID cannot be empty")
    .optional(),
  branchId: z
    .string()
    .min(1, "शाखा ID आवश्यक है / Branch ID is required"),
  bookingDate: dateString,
  slotStart: timeString,
  addOnIds: z
    .array(z.string().min(1, "ऐड-ऑन ID खाली नहीं हो सकती / Add-on ID cannot be empty"))
    .max(10, "अधिकतम 10 ऐड-ऑन / Maximum 10 add-ons")
    .optional(),
  offerCode: z
    .string()
    .min(1, "ऑफर कोड खाली नहीं हो सकता / Offer code cannot be empty")
    .optional(),
  notes: z
    .string()
    .max(500, "नोट्स अधिकतम 500 अक्षर / Notes must be at most 500 characters")
    .optional(),
});

export type CreateBookingInput = z.infer<typeof createBookingSchema>;

// ==================== CANCEL BOOKING ====================

/** Body for PATCH /api/bookings/[id]/cancel */
export const cancelBookingSchema = z.object({
  cancellationReason: z
    .string()
    .min(1, "रद्द करने का कारण आवश्यक है / Cancellation reason is required")
    .max(500, "कारण अधिकतम 500 अक्षर / Reason must be at most 500 characters"),
});

export type CancelBookingInput = z.infer<typeof cancelBookingSchema>;

// ==================== STATUS TRANSITIONS ====================

/** Body for PATCH /api/bookings/[id]/confirm — no body required */
export const confirmBookingSchema = z.object({}).optional();

/** Body for PATCH /api/bookings/[id]/start — no body required */
export const startBookingSchema = z.object({}).optional();

/** Body for PATCH /api/bookings/[id]/complete — no body required */
export const completeBookingSchema = z.object({}).optional();

/** Body for PATCH /api/bookings/[id]/no-show — no body required */
export const noShowBookingSchema = z.object({}).optional();
