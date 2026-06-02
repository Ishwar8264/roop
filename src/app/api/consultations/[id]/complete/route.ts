/**
 * Purpose: Complete consultation API endpoint
 * Responsibility: Mark a consultation as COMPLETED with optional notes (Admin/Staff only)
 *
 * Endpoints:
 *   PATCH /api/consultations/[id]/complete   — Complete a consultation
 *
 * Auth:
 *   Admin or Staff only
 *
 * PATCH Request Body:
 *   notes? (optional, max 5000 chars) — Staff consultation notes
 *
 * Responses:
 *   200: { success: true, data: consultation, message }
 *   403: { success: false, error: "PERM_STAFF_REQUIRED" }
 *   404: { success: false, error: "RES_NOT_FOUND" }
 *   409: { success: false, error: "RES_CONFLICT", message } — Already completed/cancelled
 */

import { createApiHandler } from "@/lib/api-handler";
import { prisma } from "@/lib/prisma";
import { requireActiveUser } from "@/lib/auth-helpers";
import { NotFoundError, StaffRequiredError, ConflictError } from "@/lib/errors";
import { completeConsultationSchema } from "@/lib/validations/consultations";

// ==================== Helper — extract [id] from URL ====================

function extractIdFromUrl(request: Request): string | null {
  const url = new URL(request.url);
  const segments = url.pathname.split("/");
  const consultationsIndex = segments.indexOf("consultations");
  if (consultationsIndex === -1) return null;
  return segments[consultationsIndex + 1] || null;
}

// ==================== PATCH — Complete Consultation (Admin/Staff Only) ====================

export const PATCH = createApiHandler({
  schema: completeConsultationSchema,
  successMessage: "Consultation completed successfully",
  handler: async ({ parsedBody, request }) => {
    const id = extractIdFromUrl(request);
    if (!id) {
      throw new NotFoundError("Consultation not found");
    }

    // 1. Verify admin or staff access
    const { user } = await requireActiveUser(request);
    if (user.role !== "ADMIN" && user.role !== "STAFF") {
      throw new StaffRequiredError();
    }

    // 2. Check consultation exists
    const consultation = await prisma.consultation.findUnique({
      where: { id },
    });
    if (!consultation) {
      throw new NotFoundError("Consultation not found");
    }

    // 3. Check consultation is still PENDING
    if (consultation.status !== "PENDING") {
      throw new ConflictError(
        `Consultation cannot be completed — current status is ${consultation.status}`
      );
    }

    // 4. Update consultation to COMPLETED
    const updatedConsultation = await prisma.consultation.update({
      where: { id },
      data: {
        status: "COMPLETED",
        notes: parsedBody.notes !== undefined ? parsedBody.notes : consultation.notes,
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

    // 5. Fetch staff info
    let staffInfo: Record<string, unknown> | null = null;
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
