/**
 * Purpose: Loyalty balance endpoint
 * Endpoint:
 *   GET /api/loyalty/balance — Get loyalty balance (Authenticated USER)
 */

import { createApiHandler } from "@/lib/server/api-handler";
import {
  getLoyaltyBalance,
  requireAuth,
} from "@/features/loyalty/services/loyalty-service";

// ==================== GET — LOYALTY BALANCE (AUTHENTICATED USER) ====================

export const GET = createApiHandler<null, Awaited<ReturnType<typeof getLoyaltyBalance>>>({
  schema: null,
  authHook: requireAuth,
  handler: async ({ auth }) => {
    const userId = auth!.payload.userId;
    return getLoyaltyBalance(userId);
  },
  successMessage: "लॉयल्टी बैलेंस सफलतापूर्वक प्राप्त हुआ। / Loyalty balance fetched successfully.",
});
