/**
 * Purpose: Staff commission summary API endpoint
 * Responsibility: Get commission summary for a specific staff member (admin only)
 *
 * Endpoints:
 *   GET  /api/commissions/staff/[staffId]   — Get staff commission summary (admin only)
 *
 * Response includes:
 *   - Total commissions earned
 *   - Total paid commissions
 *   - Total pending commissions
 *   - Commission count by status
 *   - Recent commission records
 *
 * Error Responses:
 *   403: { success: false, error: "PERM_ADMIN_REQUIRED" }
 *   404: { success: false, error: "RES_NOT_FOUND" }
 */

import { createApiHandler } from "@/lib/api-handler";
import { prisma } from "@/lib/prisma";
import { requireActiveUser } from "@/lib/auth-helpers";
import { NotFoundError, AdminRequiredError } from "@/lib/errors";

// ==================== Helper — extract [staffId] from URL ====================

function extractStaffIdFromUrl(request: Request): string | null {
  const url = new URL(request.url);
  const segments = url.pathname.split("/");
  const staffIndex = segments.indexOf("staff") + 1;
  return segments[staffIndex] || null;
}

// ==================== GET — Staff Commission Summary (Admin) ====================

export const GET = createApiHandler({
  schema: null,
  handler: async ({ request }) => {
    // 1. Verify admin access
    const { user } = await requireActiveUser(request);
    if (user.role !== "ADMIN") {
      throw new AdminRequiredError();
    }

    const staffId = extractStaffIdFromUrl(request);
    if (!staffId) {
      throw new NotFoundError("Staff not found");
    }

    // 2. Check staff exists
    const staff = await prisma.staff.findUnique({
      where: { id: staffId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            mobile: true,
          },
        },
      },
    });
    if (!staff) {
      throw new NotFoundError("Staff not found");
    }

    // 3. Get commission aggregates
    const commissions = await prisma.staffCommission.findMany({
      where: { staffId },
      select: {
        id: true,
        bookingId: true,
        amount: true,
        rate: true,
        status: true,
        paidAt: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    // 4. Calculate summary
    const totalAmount = commissions.reduce(
      (sum, c) => sum + Number(c.amount),
      0
    );
    const paidAmount = commissions
      .filter((c) => c.status === "PAID")
      .reduce((sum, c) => sum + Number(c.amount), 0);
    const pendingAmount = commissions
      .filter((c) => c.status === "PENDING")
      .reduce((sum, c) => sum + Number(c.amount), 0);

    const paidCount = commissions.filter((c) => c.status === "PAID").length;
    const pendingCount = commissions.filter((c) => c.status === "PENDING").length;

    // 5. Return summary with recent commissions
    return {
      staff: {
        id: staff.id,
        name: staff.user.name,
        mobile: staff.user.mobile,
        commissionRate: staff.commissionRate?.toString() ?? null,
      },
      summary: {
        totalCommissions: totalAmount.toString(),
        paidCommissions: paidAmount.toString(),
        pendingCommissions: pendingAmount.toString(),
        totalCount: commissions.length,
        paidCount,
        pendingCount,
      },
      recentCommissions: commissions.slice(0, 10).map((c) => ({
        ...c,
        amount: c.amount.toString(),
        rate: c.rate.toString(),
        paidAt: c.paidAt?.toISOString() ?? null,
      })),
    };
  },
});
