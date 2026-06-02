/**
 * Purpose: Booking start API endpoint
 * Responsibility: Mark a booking as in-progress — transition from CONFIRMED to IN_PROGRESS (admin/staff)
 *
 * Endpoint:
 *   PATCH /api/bookings/[id]/start   — Start booking (admin/staff only)
 *
 * Status Transition Rules:
 *   CONFIRMED → IN_PROGRESS (valid)
 *   Other statuses → error (invalid transition)
 *
 * PATCH Request Body:
 *   notes (optional string)
 *
 * Error Responses:
 *   400: { success: false, error, message } — invalid status transition
 *   403: { success: false, error: "PERM_STAFF_REQUIRED" }
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

// ==================== PATCH — Start Booking (Admin/Staff) ====================

export const PATCH = createApiHandler({
  schema: statusUpdateSchema,
  successMessage: "Booking started successfully",
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

    // 3. Validate status transition: CONFIRMED → IN_PROGRESS
    if (booking.status !== "CONFIRMED") {
      throw new ValidationError(`Cannot start booking with status ${booking.status}. Only CONFIRMED bookings can be started.`);
    }

    // 4. Update booking status and create history entry
    const updatedBooking = await prisma.booking.update({
      where: { id },
      data: {
        status: "IN_PROGRESS",
        statusHistory: {
          create: {
            status: "IN_PROGRESS",
            changedBy: user.id,
            reason: parsedBody.notes || "Booking started",
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
