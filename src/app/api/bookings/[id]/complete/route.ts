/**
 * Purpose: Booking complete API endpoint
 * Responsibility: Mark a booking as completed — transition from IN_PROGRESS to COMPLETED (admin/staff)
 *
 * Endpoint:
 *   PATCH /api/bookings/[id]/complete   — Complete booking (admin/staff only)
 *
 * Status Transition Rules:
 *   IN_PROGRESS → COMPLETED (valid)
 *   Other statuses → error (invalid transition)
 *   COMPLETED is a terminal state
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

// ==================== PATCH — Complete Booking (Admin/Staff) ====================

export const PATCH = createApiHandler({
  schema: statusUpdateSchema,
  successMessage: "Booking completed successfully",
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

    // 3. Validate status transition: IN_PROGRESS → COMPLETED
    if (booking.status !== "IN_PROGRESS") {
      throw new ValidationError(`Cannot complete booking with status ${booking.status}. Only IN_PROGRESS bookings can be completed.`);
    }

    // 4. Update booking status and create history entry
    const updatedBooking = await prisma.booking.update({
      where: { id },
      data: {
        status: "COMPLETED",
        statusHistory: {
          create: {
            status: "COMPLETED",
            changedBy: user.id,
            reason: parsedBody.notes || "Booking completed",
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
