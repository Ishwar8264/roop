/**
 * Purpose: Loyalty points balance API endpoint
 * Responsibility: Get current user's loyalty points balance (auth required)
 *
 * Endpoint:
 *   GET /api/loyalty/balance — Get own loyalty balance (auth required)
 *
 * GET Response:
 *   200: { success: true, data: { userId, loyaltyPoints } }
 *
 * Error Responses:
 *   401: { success: false, error: "AUTH_MISSING_TOKEN" }
 */

import { createApiHandler } from "@/lib/api-handler";
import { requireActiveUser } from "@/lib/auth-helpers";

// ==================== GET — Loyalty Balance (Auth Required) ====================

export const GET = createApiHandler({
  schema: null,
  handler: async ({ request }) => {
    // 1. Verify authenticated user
    const { user } = await requireActiveUser(request);

    // 2. Return user's loyalty points balance
    return {
      userId: user.id,
      loyaltyPoints: user.loyaltyPoints,
    };
  },
});
