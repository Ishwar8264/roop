/**
 * Purpose: Loyalty business logic service
 * Responsibility: Loyalty balance check, transaction history, point redemption, and point expiration
 * Important Notes:
 *   - Business logic lives HERE, NOT in route handlers
 *   - EARN is already handled in booking-service on COMPLETE (1 point per ₹100 spent)
 *   - This API is for balance check, transaction history, REDEEM, and EXPIRE
 *   - User.loyaltyPoints is the source of truth for current balance
 *   - REDEEM: validates sufficient balance + minimum 100 points, creates REDEEM transaction,
 *     deducts from User.loyaltyPoints in same transaction
 *   - EXPIRE: finds EARN transactions older than X days that haven't been fully redeemed,
 *     creates EXPIRE transactions, updates User.loyaltyPoints
 *   - Hindi-first user-facing messages in errors
 *   - URL-based ID extraction from request.url pathname
 */

import { prisma } from "@/lib/database/prisma";
import { requireAdmin, requireAuth } from "@/lib/server/auth-hooks";
import {
  LoyaltyInsufficientBalanceError,
  LoyaltyMinRedeemNotMetError,
  LoyaltyInvalidPointsError,
} from "@/lib/server/errors";
import type {
  LoyaltyBalanceResponse,
  LoyaltyTransactionListResponse,
  LoyaltyTransactionListQuery,
  LoyaltyTransactionItemResponse,
  RedeemPointsResponse,
  ExpirePointsResponse,
  LoyaltyTransactionType,
} from "@/features/loyalty/types";
import type { RedeemPointsInput, ExpirePointsInput } from "@/features/loyalty/validations/loyalty";
import { Prisma } from "@prisma/client";

// Re-export auth hooks for convenience in route files
export { requireAdmin, requireAuth };

// ==================== BALANCE ====================

/**
 * Get loyalty balance for a user
 * Auth: any authenticated user (own balance only)
 * Returns: current points, total earned, total redeemed, total expired
 */
export async function getLoyaltyBalance(
  userId: string
): Promise<LoyaltyBalanceResponse> {
  // Get current points from User
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { loyaltyPoints: true },
  });

  if (!user) {
    return {
      currentPoints: 0,
      totalEarned: 0,
      totalRedeemed: 0,
      totalExpired: 0,
    };
  }

  // Aggregate transaction totals
  const [earned, redeemed, expired] = await Promise.all([
    prisma.loyaltyTransaction.aggregate({
      where: { userId, type: "EARN" },
      _sum: { points: true },
    }),
    prisma.loyaltyTransaction.aggregate({
      where: { userId, type: "REDEEM" },
      _sum: { points: true },
    }),
    prisma.loyaltyTransaction.aggregate({
      where: { userId, type: "EXPIRE" },
      _sum: { points: true },
    }),
  ]);

  return {
    currentPoints: user.loyaltyPoints,
    totalEarned: earned._sum.points ?? 0,
    totalRedeemed: redeemed._sum.points ?? 0,
    totalExpired: expired._sum.points ?? 0,
  };
}

// ==================== TRANSACTIONS ====================

/**
 * List loyalty transactions for a user
 * Auth: any authenticated user (own transactions only)
 * Supports filtering by type and pagination
 */
export async function listLoyaltyTransactions(
  userId: string,
  query: LoyaltyTransactionListQuery
): Promise<LoyaltyTransactionListResponse> {
  const { type, page = 1, limit = 20 } = query;

  const where: Prisma.LoyaltyTransactionWhereInput = {
    userId,
  };

  if (type) {
    where.type = type;
  }

  // Pagination
  const skip = (page - 1) * limit;
  const take = limit;

  const [transactions, total] = await Promise.all([
    prisma.loyaltyTransaction.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take,
    }),
    prisma.loyaltyTransaction.count({ where }),
  ]);

  const items: LoyaltyTransactionItemResponse[] = transactions.map((t) => ({
    id: t.id,
    type: t.type as LoyaltyTransactionType,
    points: t.points,
    bookingId: t.bookingId,
    reason: t.reason,
    createdAt: t.createdAt.toISOString(),
  }));

  return {
    transactions: items,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

// ==================== REDEEM POINTS ====================

/**
 * Redeem loyalty points
 * Auth: any authenticated user (own points only)
 * Validates: sufficient balance, minimum 100 points
 * Creates REDEEM transaction and deducts from User.loyaltyPoints in same transaction
 */
export async function redeemPoints(
  data: RedeemPointsInput,
  userId: string
): Promise<RedeemPointsResponse> {
  // 1. Validate points
  if (data.points <= 0) {
    throw new LoyaltyInvalidPointsError();
  }

  if (data.points < 100) {
    throw new LoyaltyMinRedeemNotMetError();
  }

  // 2. Get current balance
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { loyaltyPoints: true },
  });

  if (!user || user.loyaltyPoints < data.points) {
    throw new LoyaltyInsufficientBalanceError();
  }

  // 3. Create REDEEM transaction and update user in same transaction
  const result = await prisma.$transaction(async (tx) => {
    // Create REDEEM transaction and deduct points (parallel)
    const [transaction, updatedUser] = await Promise.all([
      tx.loyaltyTransaction.create({
        data: {
          userId,
          type: "REDEEM",
          points: data.points,
          bookingId: data.bookingId ?? null,
          reason: data.bookingId
            ? `${data.points} अंक रिडीम किए गए / ${data.points} points redeemed`
            : `${data.points} अंक रिडीम किए गए / ${data.points} points redeemed`,
        },
      }),
      tx.user.update({
        where: { id: userId },
        data: { loyaltyPoints: { decrement: data.points } },
      }),
    ]);

    return {
      transactionId: transaction.id,
      points: data.points,
      remainingBalance: updatedUser.loyaltyPoints,
    };
  });

  return {
    transactionId: result.transactionId,
    points: result.points,
    remainingBalance: result.remainingBalance,
    message: `${result.points} अंक सफलतापूर्वक रिडीम किए गए। शेष बैलेंस: ${result.remainingBalance} अंक / ${result.points} points redeemed successfully. Remaining balance: ${result.remainingBalance} points`,
  };
}

// ==================== EXPIRE POINTS ====================

/**
 * Expire old loyalty points
 * Auth: ADMIN only (or system cron)
 * Finds EARN transactions older than X days that haven't been fully redeemed
 * Creates EXPIRE transactions for those, updates user.loyaltyPoints
 */
export async function expirePoints(
  data: ExpirePointsInput
): Promise<ExpirePointsResponse> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - data.olderThanDays);

  // Find all EARN transactions older than cutoff
  const earnTransactions = await prisma.loyaltyTransaction.findMany({
    where: {
      type: "EARN",
      createdAt: { lt: cutoffDate },
    },
    select: {
      id: true,
      userId: true,
      points: true,
      createdAt: true,
    },
  });

  if (earnTransactions.length === 0) {
    return {
      expiredCount: 0,
      totalPointsExpired: 0,
      message: "समाप्त होने के लिए कोई अंक नहीं मिले। / No points found to expire.",
    };
  }

  // Group by userId to process each user's points
  const userEarnMap = new Map<string, { totalEarned: number; transactionIds: string[] }>();

  for (const et of earnTransactions) {
    const existing = userEarnMap.get(et.userId) ?? { totalEarned: 0, transactionIds: [] };
    existing.totalEarned += et.points;
    existing.transactionIds.push(et.id);
    userEarnMap.set(et.userId, existing);
  }

  // For each user, calculate how much has already been redeemed/expired
  // and expire only the remaining unredeemed amount — process users in parallel
  const results = await Promise.all(
    Array.from(userEarnMap).map(async ([userId, earnData]) => {
      // Get total redeemed + expired for this user (from old transactions)
      const [redeemed, expired] = await Promise.all([
        prisma.loyaltyTransaction.aggregate({
          where: { userId, type: "REDEEM" },
          _sum: { points: true },
        }),
        prisma.loyaltyTransaction.aggregate({
          where: { userId, type: "EXPIRE" },
          _sum: { points: true },
        }),
      ]);

      const totalRedeemedOrExpired = (redeemed._sum.points ?? 0) + (expired._sum.points ?? 0);
      const pointsToExpire = Math.max(0, earnData.totalEarned - totalRedeemedOrExpired);

      if (pointsToExpire === 0) return 0;

      // Create EXPIRE transaction and update user in same transaction
      await prisma.$transaction(async (tx) => {
        // Create EXPIRE transaction
        await tx.loyaltyTransaction.create({
          data: {
            userId,
            type: "EXPIRE",
            points: pointsToExpire,
            reason: `${data.olderThanDays} दिनों से अधिक पुराने ${pointsToExpire} अंक समाप्त हो गए / ${pointsToExpire} points expired (older than ${data.olderThanDays} days)`,
          },
        });

        // Deduct from user's loyalty points (but don't go below 0)
        const user = await tx.user.findUnique({
          where: { id: userId },
          select: { loyaltyPoints: true },
        });

        if (user) {
          const deduction = Math.min(pointsToExpire, user.loyaltyPoints);
          if (deduction > 0) {
            await tx.user.update({
              where: { id: userId },
              data: { loyaltyPoints: { decrement: deduction } },
            });
          }
        }
      });

      return pointsToExpire;
    })
  );

  const totalExpiredCount = results.filter((p) => p > 0).length;
  const totalPointsExpired = results.reduce((sum, p) => sum + p, 0);

  return {
    expiredCount: totalExpiredCount,
    totalPointsExpired,
    message: `${totalExpiredCount} उपयोगकर्ताओं के ${totalPointsExpired} अंक समाप्त हो गए। / ${totalPointsExpired} points expired for ${totalExpiredCount} users.`,
  };
}
