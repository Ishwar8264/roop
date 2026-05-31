/**
 * Purpose: Cancel consultation API endpoint
 * Responsibility: Mark a consultation as CANCELLED (Admin or the user who created it)
 *
 * Endpoints:
 *   PATCH /api/consultations/[id]/cancel   — Cancel a consultation
 *
 * Auth:
 *   Admin or the user who created the consultation
 *
 * Responses:
 *   200: { success: true, data: consultation, message }
 *   403: { success: false, error: "PERM_DENIED" }
 *   404: { success: false, error: "RES_NOT_FOUND" }
 *   409: { success: false, error: "RES_CONFLICT", message } — Already completed/cancelled
 */

import { createApiHandler } from "@/lib/api-handler";
import { prisma } from "@/lib/prisma";
import { requireActiveUser } from "@/lib/auth-helpers";
import { NotFoundError, ForbiddenError, ConflictError } from "@/lib/errors";

// ==================== Helper — extract [id] from URL ====================

function extractIdFromUrl(request: Request): string | null {
  const url = new URL(request.url);
  const segments = url.pathname.split("/");
  const consultationsIndex = segments.indexOf("consultations");
  if (consultationsIndex === -1) return null;
  return segments[consultationsIndex + 1] || null;
}

// ==================== PATCH — Cancel Consultation ====================

export const PATCH = createApiHandler({
  schema: null,
  successMessage: "Consultation cancelled successfully",
  handler: async ({ request }) => {
    const id = extractIdFromUrl(request);
    if (!id) {
      throw new NotFoundError("Consultation not found");
    }

    // 1. Require authentication
    const { user } = await requireActiveUser(request);

    // 2. Check consultation exists
    const consultation = await prisma.consultation.findUnique({
      where: { id },
    });
    if (!consultation) {
      throw new NotFoundError("Consultation not found");
    }

    // 3. Check permission — only admin or the user who created it can cancel
    if (user.role !== "ADMIN" && consultation.userId !== user.id) {
      throw new ForbiddenError("You can only cancel your own consultations");
    }

    // 4. Check consultation is still PENDING
    if (consultation.status !== "PENDING") {
      throw new ConflictError(
        `Consultation cannot be cancelled — current status is ${consultation.status}`
      );
    }

    // 5. Update consultation to CANCELLED
    const updatedConsultation = await prisma.consultation.update({
      where: { id },
      data: {
        status: "CANCELLED",
      },
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
      },
    });

    // 6. Fetch staff info
    let staffInfo = null;
    if (updatedConsultation.staffId) {
      const staff = await prisma.staff.findUnique({
        where: { id: updatedConsultation.staffId },
        select: {
          id: true,
          specialization: true,
          bioHi: true,
          bioEn: true,
          photoUrl: true,
          rating: true,
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

    return {
      ...updatedConsultation,
      staff: staffInfo,
    };
  },
});
