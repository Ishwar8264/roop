/**
 * Purpose: Booking list + create endpoints
 * Endpoints:
 *   GET  /api/bookings  — List bookings (Authenticated: USER own, ADMIN/STAFF all)
 *   POST /api/bookings  — Create booking (Authenticated USER)
 */

import { createApiHandler } from "@/lib/server/api-handler";
import { createBookingSchema } from "@/features/booking/validations/booking";
import {
  listBookings,
  createBooking,
  requireAuth,
} from "@/features/booking/services/booking-service";
import type { CreateBookingInput } from "@/features/booking/validations/booking";

// ==================== GET — LIST BOOKINGS (AUTHENTICATED) ====================

export const GET = createApiHandler<null, Awaited<ReturnType<typeof listBookings>>>({
  schema: null,
  authHook: requireAuth,
  handler: async ({ request, auth }) => {
    const url = new URL(request.url);
    const userId = auth!.payload.userId;
    const userRole = auth!.user!.role;

    const status = url.searchParams.get("status") as "PENDING" | "CONFIRMED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED" | "NO_SHOW" | undefined;
    const branchId = url.searchParams.get("branchId") || undefined;
    const date = url.searchParams.get("date") || undefined;
    const queryUserId = url.searchParams.get("userId") || undefined;
    const page = parseInt(url.searchParams.get("page") || "1", 10);
    const limit = parseInt(url.searchParams.get("limit") || "20", 10);

    // Validate pagination params
    const validPage = Math.max(1, isNaN(page) ? 1 : page);
    const validLimit = Math.min(100, Math.max(1, isNaN(limit) ? 20 : limit));

    return listBookings({
      status,
      branchId,
      date,
      userId: userRole !== "USER" ? queryUserId : undefined,
      page: validPage,
      limit: validLimit,
    }, userId, userRole);
  },
  successMessage: "बुकिंग सफलतापूर्वक प्राप्त हुई। / Bookings fetched successfully.",
});

// ==================== POST — CREATE BOOKING (AUTHENTICATED USER) ====================

export const POST = createApiHandler<CreateBookingInput, Awaited<ReturnType<typeof createBooking>>>({
  schema: createBookingSchema,
  authHook: requireAuth,
  handler: async ({ parsedBody, auth }) => {
    const userId = auth!.payload.userId;
    return createBooking(parsedBody, userId);
  },
  successMessage: "बुकिंग सफलतापूर्वक बनाई गई। / Booking created successfully.",
  successStatus: 201,
});
