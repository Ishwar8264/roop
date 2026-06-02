/**
 * Purpose: Mark no-show endpoint
 * Endpoint:
 *   PATCH /api/bookings/[id]/no-show — Mark no-show (ADMIN only)
 *   Status: CONFIRMED → NO_SHOW
 */

import { createApiHandler } from "@/lib/server/api-handler";
import {
  markNoShow,
  requireAdmin,
  extractBookingIdFromUrl,
} from "@/features/booking/services/booking-service";

// ==================== PATCH — MARK NO-SHOW (ADMIN ONLY) ====================

export const PATCH = createApiHandler<null, Awaited<ReturnType<typeof markNoShow>>>({
  schema: null,
  authHook: requireAdmin,
  handler: async ({ request, auth }) => {
    const bookingId = extractBookingIdFromUrl(request.url);
    const changedBy = auth!.payload.userId;

    return markNoShow(bookingId, changedBy);
  },
  successMessage: "बुकिंग नो-शो मार्क की गई। / Booking marked as no-show.",
});
