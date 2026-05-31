/**
 * Purpose: Staff Commission payment API endpoint
 * Responsibility: Mark commission as paid (admin only)
 *
 * Endpoints:
 *   PATCH /api/commissions/[id]/pay   — Mark commission as paid (admin only)
 *
 * Payment logic:
 *   - Set status to PAID
 *   - Set paidAt to current timestamp
 *   - Return updated commission
 *
 * Error Responses:
 *   403: { success: false, error: "PERM_ADMIN_REQUIRED" }
 *   404: { success: false, error: "RES_NOT_FOUND" }
 *   400: { success: false, error: "VAL_INVALID_INPUT" } — already paid
 */

import { createApiHandler } from "@/lib/api-handler";
import { prisma } from "@/lib/prisma";
import { requireActiveUser } from "@/lib/auth-helpers";
import { NotFoundError, AdminRequiredError, ValidationError } from "@/lib/errors";
import { payCommissionSchema } from "@/lib/validations/commissions";

// ==================== Helper — extract [id] from URL ====================

function extractIdFromUrl(request: Request): string | null {
  const url = new URL(request.url);
  const segments = url.pathname.split("/");
  const idIndex = segments.indexOf("commissions") + 1;
  return segments[idIndex] || null;
}

// ==================== PATCH — Pay Commission (Admin) ====================

export const PATCH = createApiHandler({
  schema: payCommissionSchema,
  successMessage: "Commission marked as paid successfully",
  handler: async ({ request }) => {
    const id = extractIdFromUrl(request);
    if (!id) {
      throw new NotFoundError("Commission not found");
    }

    // 1. Verify admin access
    const { user } = await requireActiveUser(request);
    if (user.role !== "ADMIN") {
      throw new AdminRequiredError();
    }

    // 2. Check commission exists
    const existingCommission = await prisma.staffCommission.findUnique({
      where: { id },
    });
    if (!existingCommission) {
      throw new NotFoundError("Commission not found");
    }

    // 3. Check if already paid
    if (existingCommission.status === "PAID") {
      throw new ValidationError("Commission has already been paid");
    }

    // 4. Update commission — set status to PAID and paidAt to now
    const updatedCommission = await prisma.staffCommission.update({
      where: { id },
      data: {
        status: "PAID",
        paidAt: new Date(),
      },
      include: {
        staff: {
          select: {
            id: true,
            userId: true,
            specialization: true,
            user: {
              select: {
                id: true,
                name: true,
                mobile: true,
              },
            },
          },
        },
      },
    });

    // 5. Return with serialized decimals
    return {
      ...updatedCommission,
      amount: updatedCommission.amount.toString(),
      rate: updatedCommission.rate.toString(),
      paidAt: updatedCommission.paidAt?.toISOString() ?? null,
    };
  },
});
