/**
 * Purpose: Consultation detail API endpoint
 * Responsibility: Get full consultation detail with user, staff, and booking info
 *
 * Endpoints:
 *   GET  /api/consultations/[id]   — Get consultation detail
 *
 * Auth:
 *   Required — USER: only own consultation, ADMIN/STAFF: any consultation
 *
 * GET Response:
 *   200: { success: true, data: consultation } — Full consultation with user, staff, booking info
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
  const idIndex = segments.indexOf("consultations") + 1;
  return segments[idIndex] || null;
}

// ==================== GET — Consultation Detail (Auth Required) ====================

export const GET = createApiHandler({
  schema: null,
  handler: async ({ request }) => {
    const id = extractIdFromUrl(request);
    if (!id) {
      throw new NotFoundError("Consultation not found");
    }

    // 1. Require authentication
    const { user } = await requireActiveUser(request);

    // 2. Fetch consultation
    const consultation = await prisma.consultation.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            mobile: true,
            email: true,
            avatarUrl: true,
          },
        },
        booking: {
          select: {
            id: true,
            bookingDisplayId: true,
            status: true,
            bookingDate: true,
            slotStart: true,
            slotEnd: true,
            totalAmount: true,
            service: {
              select: {
                id: true,
                nameHi: true,
                nameEn: true,
              },
            },
          },
        },
      },
    });

    if (!consultation) {
      throw new NotFoundError("Consultation not found");
    }

    // 3. Check permission — USER can only see own consultation
    if (user.role === "USER" && consultation.userId !== user.id) {
      throw new ForbiddenError("You can only view your own consultations");
    }

    // 4. Fetch staff info (manual lookup since no Prisma relation)
    let staffInfo = null;
    if (consultation.staffId) {
      const staff = await prisma.staff.findUnique({
        where: { id: consultation.staffId },
        select: {
          id: true,
          specialization: true,
          bioHi: true,
          bioEn: true,
          photoUrl: true,
          rating: true,
          isAvailable: true,
          user: {
            select: {
              id: true,
              name: true,
              avatarUrl: true,
            },
          },
        },
      });
      if (staff) {
        staffInfo = { ...staff, rating: staff.rating.toNumber() };
      }
    }

    // 5. Return consultation with staff and booking info
    return {
      ...consultation,
      booking: consultation.booking
        ? {
            ...consultation.booking,
            totalAmount: consultation.booking.totalAmount.toString(),
          }
        : null,
      staff: staffInfo,
    };
  },
});
