/**
 * Purpose: Redeem loyalty points endpoint
 * Endpoint:
 *   POST /api/loyalty/redeem — Redeem points (Authenticated USER)
 */

import { createApiHandler } from "@/lib/server/api-handler";
import { redeemPointsSchema } from "@/features/loyalty/validations/loyalty";
import {
  redeemPoints,
  requireAuth,
} from "@/features/loyalty/services/loyalty-service";
import type { RedeemPointsInput } from "@/features/loyalty/validations/loyalty";

// ==================== POST — REDEEM POINTS (AUTHENTICATED USER) ====================

export const POST = createApiHandler<RedeemPointsInput, Awaited<ReturnType<typeof redeemPoints>>>({
  schema: redeemPointsSchema,
  authHook: requireAuth,
  handler: async ({ parsedBody, auth }) => {
    const userId = auth!.payload.userId;
    return redeemPoints(parsedBody, userId);
  },
  successMessage: "अंक सफलतापूर्वक रिडीम किए गए। / Points redeemed successfully.",
});
