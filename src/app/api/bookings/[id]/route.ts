/**
 * Purpose: Booking detail API endpoint
 * Responsibility: Get booking detail (auth required, role-based access)
 *
 * Endpoints:
 *   GET /api/bookings/[id]   — Get booking detail with full info (auth required)
 *
 * Access Rules:
 *   - USER can only see their own bookings
 *   - STAFF can see bookings assigned to them or their own
 *   - ADMIN can see all bookings
 *
 * GET Response:
 *   200: { success: true, data: booking } — Full booking with related entities
 *
 * Error Responses:
 *   401: { success: false, error: "AUTH_MISSING_TOKEN" }
 *   403: { success: false, error: "PERM_DENIED" }
 *   404: { success: false, error: "RES_NOT_FOUND" }
 */

import { createApiHandler } from "@/lib/api-handler";
import { prisma } from "@/lib/prisma";
import { requireActiveUser } from "@/lib/auth-helpers";
import { NotFoundError, ForbiddenError } from "@/lib/errors";

// ==================== Helper — extract [id] from URL ====================

function extractIdFromUrl(request: Request): string | null {
  const url = new URL(request.url);
  const segments = url.pathname.split("/");
  const idIndex = segments.indexOf("bookings") + 1;
  return segments[idIndex] || null;
}

// ==================== GET — Booking Detail (Auth Required) ====================

export const GET = createApiHandler({
  schema: null,
  handler: async ({ request }) => {
    const id = extractIdFromUrl(request);
    if (!id) {
      throw new NotFoundError("Booking not found");
    }

    // 1. Require authentication
    const { user } = await requireActiveUser(request);

    // 2. Fetch booking
    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, name: true, mobile: true, avatarUrl: true },
        },
        service: {
          select: {
            id: true,
            nameHi: true,
            nameEn: true,
            price: true,
            durationMinutes: true,
            imageUrl: true,
          },
        },
        variant: {
          select: { id: true, nameHi: true, nameEn: true, price: true, durationMinutes: true },
        },
        staff: {
          select: {
            id: true,
            user: { select: { id: true, name: true, avatarUrl: true } },
          },
        },
        branch: {
          select: { id: true, nameHi: true, nameEn: true, address: true, phone: true },
        },
        addOns: true,
        statusHistory: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!booking) {
      throw new NotFoundError("Booking not found");
    }

    // 3. Access control — USER can only see their own bookings
    if (user.role === "USER" && booking.userId !== user.id) {
      throw new ForbiddenError("You can only view your own bookings");
    }

    // STAFF can see bookings assigned to them or their own
    if (user.role === "STAFF" && booking.userId !== user.id && booking.staffId !== user.id) {
      throw new ForbiddenError("You can only view your own bookings or bookings assigned to you");
    }

    // 4. Return with serialized decimals
    return {
      ...booking,
      bookingDate: booking.bookingDate.toISOString().split("T")[0],
      advanceAmount: booking.advanceAmount ? booking.advanceAmount.toString() : null,
      totalAmount: booking.totalAmount.toString(),
      service: {
        ...booking.service,
        price: booking.service.price.toString(),
      },
      variant: booking.variant
        ? { ...booking.variant, price: booking.variant.price.toString() }
        : null,
      addOns: booking.addOns.map((ao) => ({
        ...ao,
        price: ao.price.toString(),
      })),
    };
  },
});
