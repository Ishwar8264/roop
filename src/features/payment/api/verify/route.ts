/**
 * Purpose: Verify Razorpay payment endpoint
 * Endpoint:
 *   POST /api/payments/verify — Verify Razorpay payment (Authenticated USER)
 */

import { createApiHandler } from "@/lib/server/api-handler";
import { verifyPaymentSchema } from "@/features/payment/validations/payment";
import {
  verifyPayment,
  requireAuth,
} from "@/features/payment/services/payment-service";
import type { VerifyPaymentInput } from "@/features/payment/validations/payment";

// ==================== POST — VERIFY PAYMENT (AUTHENTICATED USER) ====================

export const POST = createApiHandler<VerifyPaymentInput, Awaited<ReturnType<typeof verifyPayment>>>({
  schema: verifyPaymentSchema,
  authHook: requireAuth,
  handler: async ({ parsedBody, auth }) => {
    const userId = auth!.payload.userId;
    return verifyPayment(parsedBody, userId);
  },
  successMessage: "भुगतान सफलतापूर्वक सत्यापित हुआ। / Payment verified successfully.",
});
