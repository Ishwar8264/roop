/**
 * Purpose: Initiate refund endpoint
 * Endpoint:
 *   POST /api/payments/[id]/refund — Initiate refund (ADMIN only)
 */

import { createApiHandler } from "@/lib/server/api-handler";
import { initiateRefundSchema } from "@/features/payment/validations/payment";
import {
  initiateRefund,
  requireAdmin,
  extractPaymentIdFromUrl,
} from "@/features/payment/services/payment-service";
import type { InitiateRefundInput } from "@/features/payment/validations/payment";

// ==================== POST — INITIATE REFUND (ADMIN ONLY) ====================

export const POST = createApiHandler<InitiateRefundInput, Awaited<ReturnType<typeof initiateRefund>>>({
  schema: initiateRefundSchema,
  authHook: requireAdmin,
  handler: async ({ parsedBody, request, auth }) => {
    const paymentId = extractPaymentIdFromUrl(request.url);
    const processedBy = auth!.payload.userId;

    return initiateRefund(paymentId, parsedBody, processedBy);
  },
  successMessage: "रिफंड अनुरोध सफलतापूर्वक बनाया गया। / Refund request created successfully.",
  successStatus: 201,
});
