/**
 * Purpose: Record cash payment endpoint
 * Endpoint:
 *   POST /api/payments/cash — Record cash payment (ADMIN only)
 */

import { createApiHandler } from "@/lib/server/api-handler";
import { cashPaymentSchema } from "@/features/payment/validations/payment";
import {
  recordCashPayment,
  requireAdmin,
} from "@/features/payment/services/payment-service";
import type { CashPaymentInput } from "@/features/payment/validations/payment";

// ==================== POST — RECORD CASH PAYMENT (ADMIN ONLY) ====================

export const POST = createApiHandler<CashPaymentInput, Awaited<ReturnType<typeof recordCashPayment>>>({
  schema: cashPaymentSchema,
  authHook: requireAdmin,
  handler: async ({ parsedBody }) => {
    return recordCashPayment(parsedBody);
  },
  successMessage: "नकद भुगतान सफलतापूर्वक दर्ज किया गया। / Cash payment recorded successfully.",
  successStatus: 201,
});
