/**
 * Purpose: Confirm booking endpoint
 * Endpoint:
 *   PATCH /api/bookings/[id]/confirm — Confirm booking (ADMIN only)
 *   Status: PENDING → CONFIRMED
 */

import { createApiHandler } from "@/lib/server/api-handler";
import {
  confirmBooking,
  requireAdmin,
  extractBookingIdFromUrl,
} from "@/features/booking/services/booking-service";

// ==================== PATCH — CONFIRM BOOKING (ADMIN ONLY) ====================

export const PATCH = createApiHandler<null, Awaited<ReturnType<typeof confirmBooking>>>({
  schema: null,
  authHook: requireAdmin,
  handler: async ({ request, auth }) => {
    const bookingId = extractBookingIdFromUrl(request.url);
    const changedBy = auth!.payload.userId;

    return confirmBooking(bookingId, changedBy);
  },
  successMessage: "बुकिंग सफलतापूर्वक पुष्टि हुई। / Booking confirmed successfully.",
});
