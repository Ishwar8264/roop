/**
 * Purpose: Staff Commission detail API endpoint
 * Responsibility: Get commission detail (admin only)
 *
 * Endpoints:
 *   GET  /api/commissions/[id]   — Get commission detail with staff info (admin only)
 *
 * Error Responses:
 *   403: { success: false, error: "PERM_ADMIN_REQUIRED" }
 *   404: { success: false, error: "RES_NOT_FOUND" }
 */

import { createApiHandler } from "@/lib/api-handler";
import { prisma } from "@/lib/prisma";
import { requireActiveUser } from "@/lib/auth-helpers";
import { NotFoundError, AdminRequiredError } from "@/lib/errors";

// ==================== Helper — extract [id] from URL ====================

function extractIdFromUrl(request: Request): string | null {
  const url = new URL(request.url);
  const segments = url.pathname.split("/");
  const idIndex = segments.indexOf("commissions") + 1;
  return segments[idIndex] || null;
}

// ==================== GET — Commission Detail (Admin) ====================

export const GET = createApiHandler({
  schema: null,
  handler: async ({ request }) => {
    // 1. Verify admin access
    const { user } = await requireActiveUser(request);
    if (user.role !== "ADMIN") {
      throw new AdminRequiredError();
    }

    const id = extractIdFromUrl(request);
    if (!id) {
      throw new NotFoundError("Commission not found");
    }

    const commission = await prisma.staffCommission.findUnique({
      where: { id },
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

    if (!commission) {
      throw new NotFoundError("Commission not found");
    }

    // Return with serialized decimal values
    return {
      ...commission,
      amount: commission.amount.toString(),
      rate: commission.rate.toString(),
      paidAt: commission.paidAt?.toISOString() ?? null,
    };
  },
});
