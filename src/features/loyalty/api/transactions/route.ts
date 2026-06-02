/**
 * Purpose: Loyalty transactions list endpoint
 * Endpoint:
 *   GET /api/loyalty/transactions — List loyalty transactions (Authenticated USER)
 */

import { createApiHandler } from "@/lib/server/api-handler";
import {
  listLoyaltyTransactions,
  requireAuth,
} from "@/features/loyalty/services/loyalty-service";
import type { LoyaltyTransactionType } from "@/features/loyalty/types";

// ==================== GET — LIST LOYALTY TRANSACTIONS (AUTHENTICATED USER) ====================

export const GET = createApiHandler<null, Awaited<ReturnType<typeof listLoyaltyTransactions>>>({
  schema: null,
  authHook: requireAuth,
  handler: async ({ request, auth }) => {
    const userId = auth!.payload.userId;
    const url = new URL(request.url);

    const typeParam = url.searchParams.get("type") as LoyaltyTransactionType | null;
    const page = parseInt(url.searchParams.get("page") || "1", 10);
    const limit = parseInt(url.searchParams.get("limit") || "20", 10);

    // Validate pagination params
    const validPage = Math.max(1, isNaN(page) ? 1 : page);
    const validLimit = Math.min(100, Math.max(1, isNaN(limit) ? 20 : limit));

    // Validate type filter
    const validType: LoyaltyTransactionType | undefined =
      typeParam && ["EARN", "REDEEM", "EXPIRE"].includes(typeParam)
        ? typeParam
        : undefined;

    return listLoyaltyTransactions(userId, {
      type: validType,
      page: validPage,
      limit: validLimit,
    });
  },
  successMessage: "लॉयल्टी लेनदेन सफलतापूर्वक प्राप्त हुए। / Loyalty transactions fetched successfully.",
});
