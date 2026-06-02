/**
 * Purpose: Process refund endpoint
 * Endpoint:
 *   PATCH /api/payments/refunds/[refundId]/process — Process refund (ADMIN only)
 */

import { createApiHandler } from "@/lib/server/api-handler";
import { processRefundSchema } from "@/features/payment/validations/payment";
import {
  processRefund,
  requireAdmin,
  extractRefundIdFromUrl,
} from "@/features/payment/services/payment-service";
import type { ProcessRefundInput } from "@/features/payment/validations/payment";

// ==================== PATCH — PROCESS REFUND (ADMIN ONLY) ====================

export const PATCH = createApiHandler<ProcessRefundInput, Awaited<ReturnType<typeof processRefund>>>({
  schema: processRefundSchema,
  authHook: requireAdmin,
  handler: async ({ parsedBody, request, auth }) => {
    const refundId = extractRefundIdFromUrl(request.url);
    const processedBy = auth!.payload.userId;

    return processRefund(refundId, parsedBody, processedBy);
  },
  successMessage: "रिफंड सफलतापूर्वक प्रोसेस किया गया। / Refund processed successfully.",
});
