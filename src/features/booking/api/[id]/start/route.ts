/**
 * Purpose: Start service endpoint
 * Endpoint:
 *   PATCH /api/bookings/[id]/start — Start service (ADMIN/STAFF)
 *   Status: CONFIRMED → IN_PROGRESS
 */

import { createApiHandler } from "@/lib/server/api-handler";
import {
  startBooking,
  requireAuth,
  extractBookingIdFromUrl,
} from "@/features/booking/services/booking-service";

// ==================== PATCH — START BOOKING (ADMIN/STAFF) ====================

export const PATCH = createApiHandler<null, Awaited<ReturnType<typeof startBooking>>>({
  schema: null,
  authHook: requireAuth,
  handler: async ({ request, auth }) => {
    const bookingId = extractBookingIdFromUrl(request.url);
    const userId = auth!.payload.userId;
    const userRole = auth!.user!.role;

    return startBooking(bookingId, userId, userRole);
  },
  successMessage: "सेवा शुरू हुई। / Service started successfully.",
});
