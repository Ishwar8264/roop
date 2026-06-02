/**
 * Purpose: Revenue snapshot generation API endpoint
 * Responsibility: Generate revenue snapshot for a specific date and period (admin only)
 *
 * Endpoints:
 *   POST /api/revenue/generate   — Generate a revenue snapshot (admin only)
 *
 * POST Request Body:
 *   branchId  (required) — Which branch
 *   date      (required, YYYY-MM-DD) — Snapshot date
 *   period    (required) — "daily" | "weekly" | "monthly"
 *
 * Generate snapshot logic:
 *   - Calculate totalRevenue from completed bookings for the period
 *   - Calculate totalBookings count
 *   - Calculate avgBookingValue = totalRevenue / totalBookings
 *   - Calculate totalExpenses from Expense table for the period
 *   - Calculate netProfit = totalRevenue - totalExpenses
 *   - Upsert RevenueSnapshot (use unique constraint on branchId+date+period)
 *
 * Responses:
 *   200: { success: true, data: snapshot, message }
 *   403: { success: false, error: "PERM_ADMIN_REQUIRED", message }
 *   404: { success: false, error: "RES_NOT_FOUND" } — branch not found
 */

import { createApiHandler } from "@/lib/api-handler";
import { prisma } from "@/lib/prisma";
import { requireActiveUser } from "@/lib/auth-helpers";
import { NotFoundError, AdminRequiredError, ValidationError } from "@/lib/errors";
import { HTTP_STATUS } from "@/lib/http";
import { generateSnapshotSchema } from "@/lib/validations/revenue";

// ==================== POST — Generate Revenue Snapshot (Admin) ====================

export const POST = createApiHandler({
  schema: generateSnapshotSchema,
  successMessage: "Revenue snapshot generated successfully",
  handler: async ({ parsedBody, request }) => {
    const { branchId, date, period } = parsedBody;

    // 1. Verify admin access
    const { user } = await requireActiveUser(request);
    if (user.role !== "ADMIN") {
      throw new AdminRequiredError();
    }

    // 2. Check branch exists
    const branch = await prisma.branch.findUnique({
      where: { id: branchId },
    });
    if (!branch) {
      throw new NotFoundError("Branch not found");
    }

    // 3. Calculate date range based on period
    const snapshotDate = new Date(date);
    let startDate: Date;
    let endDate: Date;

    switch (period) {
      case "daily":
        startDate = new Date(snapshotDate);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(snapshotDate);
        endDate.setHours(23, 59, 59, 999);
        break;
      case "weekly": {
        // Week starts on Monday (snapshot date is the week's start date)
        startDate = new Date(snapshotDate);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(snapshotDate);
        endDate.setDate(endDate.getDate() + 6);
        endDate.setHours(23, 59, 59, 999);
        break;
      }
      case "monthly": {
        // Month starts on 1st
        startDate = new Date(snapshotDate.getFullYear(), snapshotDate.getMonth(), 1);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(snapshotDate.getFullYear(), snapshotDate.getMonth() + 1, 0);
        endDate.setHours(23, 59, 59, 999);
        break;
      }
    }

    // 4. Calculate totalRevenue from completed bookings
    const completedBookings = await prisma.booking.findMany({
      where: {
        branchId,
        status: "COMPLETED",
        bookingDate: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        totalAmount: true,
      },
    });

    const totalRevenue = completedBookings.reduce(
      (sum, booking) => sum + Number(booking.totalAmount),
      0
    );
    const totalBookings = completedBookings.length;
    const avgBookingValue = totalBookings > 0 ? totalRevenue / totalBookings : 0;

    // 5. Calculate totalExpenses from Expense table
    const expenses = await prisma.expense.findMany({
      where: {
        branchId,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        amount: true,
      },
    });

    const totalExpenses = expenses.reduce(
      (sum, expense) => sum + Number(expense.amount),
      0
    );

    // 6. Calculate netProfit
    const netProfit = totalRevenue - totalExpenses;

    // 7. Upsert RevenueSnapshot (use unique constraint on branchId+date+period)
    const snapshot = await prisma.revenueSnapshot.upsert({
      where: {
        branchId_date_period: {
          branchId,
          date: snapshotDate,
          period,
        },
      },
      update: {
        totalRevenue,
        totalBookings,
        avgBookingValue,
        totalExpenses,
        netProfit,
      },
      create: {
        branchId,
        date: snapshotDate,
        period,
        totalRevenue,
        totalBookings,
        avgBookingValue,
        totalExpenses,
        netProfit,
      },
      include: {
        branch: {
          select: {
            id: true,
            nameHi: true,
            nameEn: true,
          },
        },
      },
    });

    // 8. Return with serialized decimals
    return {
      ...snapshot,
      date: snapshot.date.toISOString().split("T")[0],
      totalRevenue: snapshot.totalRevenue.toString(),
      avgBookingValue: snapshot.avgBookingValue.toString(),
      totalExpenses: snapshot.totalExpenses.toString(),
      netProfit: snapshot.netProfit.toString(),
    };
  },
});
