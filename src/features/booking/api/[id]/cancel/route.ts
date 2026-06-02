/**
 * Purpose: Cancel booking endpoint
 * Endpoint:
 *   PATCH /api/bookings/[id]/cancel — Cancel booking (USER own or ADMIN)
 *   Status: PENDING/CONFIRMED → CANCELLED
 *   Body: cancellationReason (required)
 */

import { createApiHandler } from "@/lib/server/api-handler";
import { cancelBookingSchema } from "@/features/booking/validations/booking";
import {
  cancelBooking,
  requireAuth,
  extractBookingIdFromUrl,
} from "@/features/booking/services/booking-service";
import type { CancelBookingInput } from "@/features/booking/validations/booking";

// ==================== PATCH — CANCEL BOOKING (USER OWN OR ADMIN) ====================

export const PATCH = createApiHandler<CancelBookingInput, Awaited<ReturnType<typeof cancelBooking>>>({
  schema: cancelBookingSchema,
  authHook: requireAuth,
  handler: async ({ parsedBody, request, auth }) => {
    const bookingId = extractBookingIdFromUrl(request.url);
    const userId = auth!.payload.userId;
    const userRole = auth!.user!.role;

    return cancelBooking(bookingId, parsedBody, userId, userRole);
  },
  successMessage: "बुकिंग सफलतापूर्वक रद्द हुई। / Booking cancelled successfully.",
});
