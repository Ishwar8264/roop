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

    // 4. Calculate summary — single pass through commissions
    const summary = commissions.reduce(
      (acc, c) => {
        const amount = Number(c.amount);
        acc.totalAmount += amount;
        if (c.status === "PAID") {
          acc.paidAmount += amount;
          acc.paidCount++;
        } else if (c.status === "PENDING") {
          acc.pendingAmount += amount;
          acc.pendingCount++;
        }
        return acc;
      },
      { totalAmount: 0, paidAmount: 0, pendingAmount: 0, paidCount: 0, pendingCount: 0 },
    );

    // 5. Return summary with recent commissions
    return {
      staff: {
        id: staff.id,
        name: staff.user.name,
        mobile: staff.user.mobile,
        commissionRate: staff.commissionRate?.toString() ?? null,
      },
      summary: {
        totalCommissions: summary.totalAmount.toString(),
        paidCommissions: summary.paidAmount.toString(),
        pendingCommissions: summary.pendingAmount.toString(),
        totalCount: commissions.length,
        paidCount: summary.paidCount,
        pendingCount: summary.pendingCount,
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
