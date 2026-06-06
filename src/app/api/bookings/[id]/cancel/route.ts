/**
 * Purpose: Booking cancel API endpoint
 * Responsibility: Cancel a booking — transition to CANCELLED (admin or booking owner)
 *
 * Endpoint:
 *   PATCH /api/bookings/[id]/cancel   — Cancel booking (admin or booking owner)
 *
 * Status Transition Rules:
 *   PENDING → CANCELLED (valid)
 *   CONFIRMED → CANCELLED (valid)
 *   IN_PROGRESS → CANCELLED (valid)
 *   COMPLETED → (terminal, cannot cancel)
 *   CANCELLED → (terminal, cannot cancel)
 *   NO_SHOW → (terminal, cannot cancel)
 *
 * PATCH Request Body:
 *   reason (optional string)
 *
 * Access Rules:
 *   - Admin can cancel any booking
 *   - Staff can cancel bookings assigned to them
 *   - User can cancel their own bookings (only PENDING or CONFIRMED)
 *
 * Error Responses:
 *   400: { success: false, error, message } — invalid status transition
 *   403: { success: false, error: "PERM_DENIED" }
 *   404: { success: false, error: "RES_NOT_FOUND" }
 */

import { createApiHandler } from "@/lib/api-handler";
import { prisma } from "@/lib/prisma";
import { requireActiveUser } from "@/lib/auth-helpers";
import { NotFoundError, ValidationError, ForbiddenError } from "@/lib/errors";
import { cancelBookingSchema } from "@/lib/validations/bookings";

// ==================== Helper — extract booking [id] from URL ====================

function extractBookingIdFromUrl(request: Request): string | null {
  const url = new URL(request.url);
  const segments = url.pathname.split("/");
  const bookingsIndex = segments.indexOf("bookings");
  if (bookingsIndex === -1) return null;
  return segments[bookingsIndex + 1] || null;
}

// ==================== PATCH — Cancel Booking ====================

export const PATCH = createApiHandler({
  schema: cancelBookingSchema,
  successMessage: "Booking cancelled successfully",
  handler: async ({ parsedBody, request }) => {
    const id = extractBookingIdFromUrl(request);
    if (!id) {
      throw new NotFoundError("Booking not found");
    }

    // 1. Require authentication and fetch booking (parallel)
    const [{ user }, booking] = await Promise.all([
      requireActiveUser(request),
      prisma.booking.findUnique({ where: { id } }),
    ]);
    if (!booking) {
      throw new NotFoundError("Booking not found");
    }

    // 3. Access control
    const isAdmin = user.role === "ADMIN";
    const _isStaff = user.role === "STAFF";
    const isOwner = booking.userId === user.id;
    const isAssignedStaff = booking.staffId === user.id;

    if (!isAdmin && !isOwner && !isAssignedStaff) {
      throw new ForbiddenError("You can only cancel your own bookings");
    }

    // 4. Validate status transition
    const cancellableStatuses = ["PENDING", "CONFIRMED", "IN_PROGRESS"];
    if (!cancellableStatuses.includes(booking.status)) {
      throw new ValidationError(`Cannot cancel booking with status ${booking.status}. Only PENDING, CONFIRMED, or IN_PROGRESS bookings can be cancelled.`);
    }

    // Users can only cancel PENDING or CONFIRMED bookings
    if (user.role === "USER" && booking.status === "IN_PROGRESS") {
      throw new ForbiddenError("You cannot cancel an in-progress booking. Please contact support.");
    }

    // 5. Update booking status and create history entry
    const updatedBooking = await prisma.booking.update({
      where: { id },
      data: {
        status: "CANCELLED",
        cancellationReason: parsedBody.reason || null,
        statusHistory: {
          create: {
            status: "CANCELLED",
            changedBy: user.id,
            reason: parsedBody.reason || "Booking cancelled",
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

    // 6. Return with serialized decimals
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
