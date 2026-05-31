/**
 * Purpose: Loyalty points expiry API endpoint
 * Responsibility: Expire old loyalty points (admin only)
 *
 * Endpoint:
 *   POST /api/loyalty/expire — Expire old points (admin only)
 *
 * POST Request Body:
 *   olderThanMonths (default 12) — Expire EARN transactions older than this many months
 *
 * Expiry Logic:
 *   - Find all EARN transactions older than X months where points are still positive
 *   - For each user, calculate unexpired points balance
 *   - Find users with expired EARN transactions
 *   - Create EXPIRE transaction records for each user
 *   - Update user.loyaltyPoints accordingly
 *
 * Response:
 *   200: { success: true, data: { expiredUsers, totalPointsExpired }, message }
 *   403: { success: false, error: "PERM_ADMIN_REQUIRED" }
 */

import { createApiHandler } from "@/lib/api-handler";
import { prisma } from "@/lib/prisma";
import { requireActiveUser } from "@/lib/auth-helpers";
import { AdminRequiredError } from "@/lib/errors";
import { expirePointsSchema } from "@/lib/validations/loyalty";

// ==================== POST — Expire Points (Admin) ====================

export const POST = createApiHandler({
  schema: expirePointsSchema,
  successMessage: "Points expiry processed successfully",
  handler: async ({ parsedBody, request }) => {
    const { olderThanMonths } = parsedBody;

    // 1. Verify admin access
    const { user } = await requireActiveUser(request);
    if (user.role !== "ADMIN") {
      throw new AdminRequiredError();
    }

    // 2. Calculate the cutoff date
    const cutoffDate = new Date();
    cutoffDate.setMonth(cutoffDate.getMonth() - olderThanMonths);

    // 3. Find EARN transactions older than the cutoff
    const expiredEarnTransactions = await prisma.loyaltyTransaction.findMany({
      where: {
        type: "EARN",
        points: { gt: 0 },
        createdAt: { lt: cutoffDate },
      },
      select: {
        id: true,
        userId: true,
        points: true,
      },
    });

    if (expiredEarnTransactions.length === 0) {
      return {
        expiredUsers: 0,
        totalPointsExpired: 0,
        message: "No expired points found",
      };
    }

    // 4. Group by userId and sum expired points
    const userExpiredPoints = new Map<string, number>();
    for (const tx of expiredEarnTransactions) {
      const current = userExpiredPoints.get(tx.userId) || 0;
      userExpiredPoints.set(tx.userId, current + tx.points);
    }

    // 5. For each user, check if they still have points to expire
    // (they might have already redeemed some)
    let totalPointsExpired = 0;
    let expiredUsers = 0;

    for (const [userId, expiredEarned] of userExpiredPoints) {
      // Get user's current balance
      const dbUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { loyaltyPoints: true },
      });

      if (!dbUser || dbUser.loyaltyPoints <= 0) continue;

      // Calculate how many points to expire
      // (can't expire more than user currently has)
      const pointsToExpire = Math.min(expiredEarned, dbUser.loyaltyPoints);

      if (pointsToExpire <= 0) continue;

      // Create EXPIRE transaction
      await prisma.loyaltyTransaction.create({
        data: {
          userId,
          type: "EXPIRE",
          points: -pointsToExpire,
          reason: `Points expired — older than ${olderThanMonths} months`,
        },
      });

      // Deduct from user balance
      await prisma.user.update({
        where: { id: userId },
        data: {
          loyaltyPoints: {
            decrement: pointsToExpire,
          },
        },
      });

      totalPointsExpired += pointsToExpire;
      expiredUsers++;
    }

    // 6. Return summary
    return {
      expiredUsers,
      totalPointsExpired,
      cutoffDate: cutoffDate.toISOString(),
    };
  },
});
