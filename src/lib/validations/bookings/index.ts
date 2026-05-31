/**
 * Purpose: Zod validation schemas for Bookings API routes
 * Responsibility: Validate all booking API inputs using shared primitives
 * Important Notes:
 *   - Uses common schemas from validations/common.ts
 *   - One schema per API endpoint
 *   - Export both schema and inferred type
 *   - All monetary values as decimal strings
 *   - Date as YYYY-MM-DD, time as HH:MM
 */

import { z } from "zod";
import { cuid, nonEmptyString, timeString, dateString, pageParam, pageSizeParam } from "../common";

// ==================== CREATE BOOKING ====================

/** POST /api/bookings */
export const createBookingSchema = z.object({
  serviceId: cuid,
  variantId: cuid.optional(),
  staffId: cuid.optional(),
  branchId: cuid,
  bookingDate: dateString,
  slotStart: timeString,
  addOnIds: z.array(cuid).optional(),
  notes: nonEmptyString.optional(),
});

export type CreateBookingInput = z.infer<typeof createBookingSchema>;

// ==================== LIST BOOKINGS QUERY ====================

/** GET /api/bookings — query params */
export const listBookingsQuerySchema = z.object({
  branchId: cuid.optional(),
  staffId: cuid.optional(),
  status: z.enum(["PENDING", "CONFIRMED", "IN_PROGRESS", "COMPLETED", "CANCELLED", "NO_SHOW"]).optional(),
  date: dateString.optional(),
  page: pageParam,
  pageSize: pageSizeParam,
});

export type ListBookingsQueryInput = z.infer<typeof listBookingsQuerySchema>;

// ==================== CANCEL BOOKING ====================

/** PATCH /api/bookings/[id]/cancel */
export const cancelBookingSchema = z.object({
  reason: nonEmptyString.optional(),
});

export type CancelBookingInput = z.infer<typeof cancelBookingSchema>;

// ==================== STATUS UPDATE ====================

/** PATCH /api/bookings/[id]/confirm|start|complete|no-show */
export const statusUpdateSchema = z.object({
  notes: nonEmptyString.optional(),
});

export type StatusUpdateInput = z.infer<typeof statusUpdateSchema>;
