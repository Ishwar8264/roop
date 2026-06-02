/**
 * Purpose: Expire old loyalty points endpoint
 * Endpoint:
 *   POST /api/loyalty/expire — Expire old points (ADMIN only / System cron)
 */

import { createApiHandler } from "@/lib/server/api-handler";
import { expirePointsSchema } from "@/features/loyalty/validations/loyalty";
import {
  expirePoints,
  requireAdmin,
} from "@/features/loyalty/services/loyalty-service";
import type { ExpirePointsInput } from "@/features/loyalty/validations/loyalty";

// ==================== POST — EXPIRE OLD POINTS (ADMIN ONLY) ====================

export const POST = createApiHandler<ExpirePointsInput, Awaited<ReturnType<typeof expirePoints>>>({
  schema: expirePointsSchema,
  authHook: requireAdmin,
  handler: async ({ parsedBody }) => {
    return expirePoints(parsedBody);
  },
  successMessage: "पुराने अंक सफलतापूर्वक समाप्त किए गए। / Old points expired successfully.",
});
