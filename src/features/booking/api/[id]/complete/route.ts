/**
 * Purpose: Complete service endpoint
 * Endpoint:
 *   PATCH /api/bookings/[id]/complete — Complete service (ADMIN/STAFF)
 *   Status: IN_PROGRESS → COMPLETED
 *   Side effects: Calculate staff commission, add loyalty points
 */

import { createApiHandler } from "@/lib/server/api-handler";
import {
  completeBooking,
  requireAuth,
  extractBookingIdFromUrl,
} from "@/features/booking/services/booking-service";

// ==================== PATCH — COMPLETE BOOKING (ADMIN/STAFF) ====================

export const PATCH = createApiHandler<null, Awaited<ReturnType<typeof completeBooking>>>({
  schema: null,
  authHook: requireAuth,
  handler: async ({ request, auth }) => {
    const bookingId = extractBookingIdFromUrl(request.url);
    const userId = auth!.payload.userId;
    const userRole = auth!.user!.role;

    return completeBooking(bookingId, userId, userRole);
  },
  successMessage: "सेवा सफलतापूर्वक पूरी हुई। / Service completed successfully.",
});
