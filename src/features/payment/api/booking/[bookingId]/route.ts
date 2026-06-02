/**
 * Purpose: Get payments for a booking endpoint
 * Endpoint:
 *   GET /api/payments/booking/[bookingId] — Get payments for a booking (Authenticated)
 */

import { createApiHandler } from "@/lib/server/api-handler";
import {
  getBookingPayments,
  requireAuth,
  extractBookingIdFromPaymentUrl,
} from "@/features/payment/services/payment-service";

// ==================== GET — PAYMENTS FOR BOOKING (AUTHENTICATED) ====================

export const GET = createApiHandler<null, Awaited<ReturnType<typeof getBookingPayments>>>({
  schema: null,
  authHook: requireAuth,
  handler: async ({ request, auth }) => {
    const bookingId = extractBookingIdFromPaymentUrl(request.url);
    const userId = auth!.payload.userId;
    const userRole = auth!.user!.role;

    return getBookingPayments(bookingId, userId, userRole);
  },
  successMessage: "भुगतान सफलतापूर्वक प्राप्त हुए। / Payments fetched successfully.",
});
