/**
 * Purpose: Get booking detail endpoint
 * Endpoint:
 *   GET /api/bookings/[id] — Get booking detail (Authenticated: own booking or ADMIN)
 */

import { createApiHandler } from "@/lib/server/api-handler";
import {
  getBookingDetail,
  requireAuth,
  extractBookingIdFromUrl,
} from "@/features/booking/services/booking-service";

// ==================== GET — BOOKING DETAIL (AUTHENTICATED) ====================

export const GET = createApiHandler<null, Awaited<ReturnType<typeof getBookingDetail>>>({
  schema: null,
  authHook: requireAuth,
  handler: async ({ request, auth }) => {
    const bookingId = extractBookingIdFromUrl(request.url);
    const userId = auth!.payload.userId;
    const userRole = auth!.user!.role;

    return getBookingDetail(bookingId, userId, userRole);
  },
  successMessage: "बुकिंग विवरण सफलतापूर्वक प्राप्त हुआ। / Booking detail fetched successfully.",
});
