/**
 * Purpose: Daily revenue API endpoint
 * Responsibility: Get daily revenue data for a date range (admin only)
 *
 * Endpoints:
 *   GET  /api/revenue/daily   — Get daily revenue for a date range (admin only)
 *
 * GET Query Params:
 *   branchId  (optional) — Filter by branch
 *   dateFrom  (required, YYYY-MM-DD) — Start date
 *   dateTo    (required, YYYY-MM-DD) — End date
 *
 * Responses:
 *   200: { success: true, data: { snapshots } }
 *   403: { success: false, error: "PERM_ADMIN_REQUIRED", message }
 */

import { createApiHandler } from "@/lib/api-handler";
import { prisma } from "@/lib/prisma";
import { requireActiveUser } from "@/lib/auth-helpers";
import { AdminRequiredError } from "@/lib/errors";
import { HTTP_STATUS } from "@/lib/http";
import { dailyRevenueQuerySchema } from "@/lib/validations/revenue";

// ==================== GET — Daily Revenue (Admin) ====================

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
    const queryResult = dailyRevenueQuerySchema.safeParse({
      branchId: url.searchParams.get("branchId") || undefined,
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

    const { branchId, dateFrom, dateTo } = queryResult.data;

    // 3. Build where clause
    const where: Record<string, unknown> = {
      period: "daily",
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

    // 5. Return with serialized decimals
    return {
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
