/**
 * Purpose: Create Razorpay order endpoint
 * Endpoint:
 *   POST /api/payments/create-order — Create Razorpay order (Authenticated USER)
 */

import { createApiHandler } from "@/lib/server/api-handler";
import { createOrderSchema } from "@/features/payment/validations/payment";
import {
  createOrder,
  requireAuth,
} from "@/features/payment/services/payment-service";
import type { CreateOrderInput } from "@/features/payment/validations/payment";

// ==================== POST — CREATE RAZORPAY ORDER (AUTHENTICATED USER) ====================

export const POST = createApiHandler<CreateOrderInput, Awaited<ReturnType<typeof createOrder>>>({
  schema: createOrderSchema,
  authHook: requireAuth,
  handler: async ({ parsedBody, auth }) => {
    const userId = auth!.payload.userId;
    return createOrder(parsedBody, userId);
  },
  successMessage: "भुगतान ऑर्डर सफलतापूर्वक बनाया गया। / Payment order created successfully.",
  successStatus: 201,
});
