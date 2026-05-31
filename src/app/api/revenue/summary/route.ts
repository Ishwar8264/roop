/**
 * Purpose: Revenue summary API endpoint
 * Responsibility: Get revenue summary for a period (admin only)
 *
 * Endpoints:
 *   GET  /api/revenue/summary   — Get revenue summary for a period (admin only)
 *
 * GET Query Params:
 *   branchId  (optional) — Filter by branch
 *   period    (required) — "daily" | "weekly" | "monthly"
 *   dateFrom  (required, YYYY-MM-DD) — Start date
 *   dateTo    (required, YYYY-MM-DD) — End date
 *
 * Responses:
 *   200: { success: true, data: { summary, snapshots } }
 *   403: { success: false, error: "PERM_ADMIN_REQUIRED", message }
 */

import { createApiHandler } from "@/lib/api-handler";
import { prisma } from "@/lib/prisma";
import { requireActiveUser } from "@/lib/auth-helpers";
import { AdminRequiredError } from "@/lib/errors";
import { HTTP_STATUS } from "@/lib/http";
import { summaryQuerySchema } from "@/lib/validations/revenue";

// ==================== GET — Revenue Summary (Admin) ====================

export const GET = createApiHandler({
  schema: null,
  handler: async ({ request }) => {
    // 1. Verify admin access
    const { user } = await requireActiveUser(request);
    if (user.role !== "ADMIN") {
      throw new AdminRequiredError();
    }

    // 2. Parse and validate query params
    const url = new URL(request.url);
    const queryResult = summaryQuerySchema.safeParse({
      branchId: url.searchParams.get("branchId") || undefined,
      period: url.searchParams.get("period") || undefined,
      dateFrom: url.searchParams.get("dateFrom") || undefined,
      dateTo: url.searchParams.get("dateTo") || undefined,
    });

    if (!queryResult.success) {
      const firstIssue = queryResult.error.issues[0];
      const fieldPath = firstIssue.path.join(".");
      const message = fieldPath
        ? `${fieldPath}: ${firstIssue.message}`
        : firstIssue.message;

      return Response.json(
        {
          success: false,
          error: "VAL_INVALID_INPUT",
          message,
          statusCode: HTTP_STATUS.BAD_REQUEST,
        },
        { status: HTTP_STATUS.BAD_REQUEST }
      );
    }

    const { branchId, period, dateFrom, dateTo } = queryResult.data;

    // 3. Build where clause
    const where: Record<string, unknown> = {
      period,
      date: {
        gte: new Date(dateFrom),
        lte: new Date(dateTo),
      },
    };
    if (branchId) where.branchId = branchId;

    // 4. Fetch revenue snapshots
    const snapshots = await prisma.revenueSnapshot.findMany({
      where,
      include: {
        branch: {
          select: {
            id: true,
            nameHi: true,
            nameEn: true,
          },
        },
      },
      orderBy: { date: "asc" },
    });

    // 5. Calculate aggregate summary
    const totalRevenue = snapshots.reduce(
      (sum, s) => sum + Number(s.totalRevenue),
      0
    );
    const totalBookings = snapshots.reduce(
      (sum, s) => sum + s.totalBookings,
      0
    );
    const totalExpenses = snapshots.reduce(
      (sum, s) => sum + Number(s.totalExpenses),
      0
    );
    const netProfit = totalRevenue - totalExpenses;
    const avgBookingValue = totalBookings > 0 ? totalRevenue / totalBookings : 0;

    // 6. Return summary and individual snapshots
    return {
      summary: {
        totalRevenue: totalRevenue.toFixed(2),
        totalBookings,
        avgBookingValue: avgBookingValue.toFixed(2),
        totalExpenses: totalExpenses.toFixed(2),
        netProfit: netProfit.toFixed(2),
        snapshotCount: snapshots.length,
      },
      snapshots: snapshots.map((s) => ({
        ...s,
        date: s.date.toISOString().split("T")[0],
        totalRevenue: s.totalRevenue.toString(),
        avgBookingValue: s.avgBookingValue.toString(),
        totalExpenses: s.totalExpenses.toString(),
        netProfit: s.netProfit.toString(),
      })),
    };
  },
});
