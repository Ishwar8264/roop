/**
 * Purpose: Booking confirm API endpoint
 * Responsibility: Confirm a booking — transition from PENDING to CONFIRMED (admin/staff)
 *
 * Endpoint:
 *   PATCH /api/bookings/[id]/confirm   — Confirm booking (admin/staff only)
 *
 * Status Transition Rules:
 *   PENDING → CONFIRMED (valid)
 *   Other statuses → error (invalid transition)
 *
 * PATCH Request Body:
 *   notes (optional string)
 *
 * Error Responses:
 *   400: { success: false, error, message } — invalid status transition
 *   403: { success: false, error: "PERM_ADMIN_REQUIRED" | "PERM_STAFF_REQUIRED" }
 *   404: { success: false, error: "RES_NOT_FOUND" }
 */

import { createApiHandler } from "@/lib/api-handler";
import { prisma } from "@/lib/prisma";
import { requireActiveUser } from "@/lib/auth-helpers";
import { NotFoundError, ValidationError, StaffRequiredError } from "@/lib/errors";
import { statusUpdateSchema } from "@/lib/validations/bookings";

// ==================== Helper — extract booking [id] from URL ====================

function extractBookingIdFromUrl(request: Request): string | null {
  const url = new URL(request.url);
  const segments = url.pathname.split("/");
  const bookingsIndex = segments.indexOf("bookings");
  if (bookingsIndex === -1) return null;
  return segments[bookingsIndex + 1] || null;
}

// ==================== PATCH — Confirm Booking (Admin/Staff) ====================

export const PATCH = createApiHandler({
  schema: statusUpdateSchema,
  successMessage: "Booking confirmed successfully",
  handler: async ({ parsedBody, request }) => {
    const id = extractBookingIdFromUrl(request);
    if (!id) {
      throw new NotFoundError("Booking not found");
    }

    // 1. Verify admin or staff access
    const { user } = await requireActiveUser(request);
    if (user.role !== "ADMIN" && user.role !== "STAFF") {
      throw new StaffRequiredError();
    }

    // 2. Fetch booking
    const booking = await prisma.booking.findUnique({
      where: { id },
    });
    if (!booking) {
      throw new NotFoundError("Booking not found");
    }

    // 3. Validate status transition: PENDING → CONFIRMED
    if (booking.status !== "PENDING") {
      throw new ValidationError(`Cannot confirm booking with status ${booking.status}. Only PENDING bookings can be confirmed.`);
    }

    // 4. Update booking status and create history entry
    const updatedBooking = await prisma.booking.update({
      where: { id },
      data: {
        status: "CONFIRMED",
        statusHistory: {
          create: {
            status: "CONFIRMED",
            changedBy: user.id,
            reason: parsedBody.notes || "Booking confirmed",
          },
        },
      },
      include: {
        user: { select: { id: true, name: true, mobile: true } },
        service: { select: { id: true, nameHi: true, nameEn: true, price: true } },
        variant: { select: { id: true, nameHi: true, nameEn: true, price: true } },
        staff: { select: { id: true, user: { select: { name: true } } } },
        branch: { select: { id: true, nameHi: true, nameEn: true } },
      },
    });

    // 5. Return with serialized decimals
    return {
      ...updatedBooking,
      bookingDate: updatedBooking.bookingDate.toISOString().split("T")[0],
      advanceAmount: updatedBooking.advanceAmount ? updatedBooking.advanceAmount.toString() : null,
      totalAmount: updatedBooking.totalAmount.toString(),
      service: { ...updatedBooking.service, price: updatedBooking.service.price.toString() },
      variant: updatedBooking.variant ? { ...updatedBooking.variant, price: updatedBooking.variant.price.toString() } : null,
    };
  },
});
