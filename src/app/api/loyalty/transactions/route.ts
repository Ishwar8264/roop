/**
 * Purpose: Loyalty points transaction history API endpoint alias
 * Responsibility: Get current user's loyalty transaction history with legacy limit query support
 * Important Notes: Live App Router route; does not depend on feature-level route wrappers.
 */

import { createApiHandler } from "@/lib/api-handler";
import { requireActiveUser } from "@/lib/auth-helpers";
import { HTTP_STATUS } from "@/lib/http";
import { prisma } from "@/lib/prisma";

const LOYALTY_TRANSACTION_TYPES = ["EARN", "REDEEM", "EXPIRE"] as const;

function getPositiveIntParam(value: string | null, fallback: number) {
  const parsedValue = Number.parseInt(value ?? "", 10);
  return Number.isNaN(parsedValue) ? fallback : Math.max(1, parsedValue);
}

function getLoyaltyTransactionType(value: string | null) {
  if (!value) return undefined;
  return LOYALTY_TRANSACTION_TYPES.includes(value as (typeof LOYALTY_TRANSACTION_TYPES)[number])
    ? value
    : undefined;
}

// ==================== GET — Loyalty Transactions (Auth Required) ====================

export const GET = createApiHandler({
  schema: null,
  handler: async ({ request }) => {
    const { user } = await requireActiveUser(request);
    const url = new URL(request.url);

    const page = getPositiveIntParam(url.searchParams.get("page"), 1);
    const limit = Math.min(100, getPositiveIntParam(url.searchParams.get("limit"), 20));
    const type = getLoyaltyTransactionType(url.searchParams.get("type"));

    const where: Record<string, unknown> = { userId: user.id };
    if (type) where.type = type;

    const [total, transactions] = await Promise.all([
      prisma.loyaltyTransaction.count({ where }),
      prisma.loyaltyTransaction.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    return {
      items: transactions,
      pagination: {
        page,
        pageSize: limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  },
  successMessage: "लॉयल्टी लेनदेन सफलतापूर्वक प्राप्त हुए। / Loyalty transactions fetched successfully.",
  successStatus: HTTP_STATUS.OK,
});
