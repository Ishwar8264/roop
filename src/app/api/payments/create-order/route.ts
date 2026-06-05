/**
 * Purpose: Create payment order API endpoint
 * Responsibility: Create a payment record (auth required) — Razorpay order or CASH/UPI direct
 *
 * Endpoint:
 *   POST /api/payments/create-order — Create payment order (auth required)
 *
 * POST Request Body:
 *   bookingId (required) — Booking to pay for
 *   provider  (required) — Payment provider: RAZORPAY | CASH | UPI
 *   amount    (required) — Payment amount (decimal string)
 *
 * Payment Creation Logic:
 *   - RAZORPAY: Create Payment record with providerOrderId (mock/simulate order creation)
 *   - CASH/UPI: Create Payment record directly (no external order needed)
 *   - Validates booking exists and belongs to the user
 *   - Sets payment status to PENDING initially
 *
 * Response:
 *   201: { success: true, data: payment, message }
 *   400: { success: false, error, message }
 *   404: { success: false, error: "RES_NOT_FOUND" }
 */

import { createApiHandler } from "@/lib/api-handler";
import { prisma } from "@/lib/prisma";
import { requireActiveUser } from "@/lib/auth-helpers";
import { NotFoundError, ConflictError } from "@/lib/errors";
import { HTTP_STATUS } from "@/lib/http";
import { createPaymentSchema } from "@/lib/validations/payments";

// ==================== POST — Create Payment Order (Auth Required) ====================

export const POST = createApiHandler({
  schema: createPaymentSchema,
  successMessage: "Payment order created successfully",
  successStatus: HTTP_STATUS.CREATED,
  handler: async ({ parsedBody, request }) => {
    const { bookingId, provider, amount } = parsedBody;

    // 1. Verify authenticated user
    const { user } = await requireActiveUser(request);

    // 2. Check booking exists and check for existing payment (parallel)
    const [booking, existingPayment] = await Promise.all([
      prisma.booking.findUnique({ where: { id: bookingId } }),
      prisma.payment.findFirst({
        where: {
          bookingId,
          status: { in: ["SUCCESS", "PENDING"] },
        },
      }),
    ]);

    if (!booking) {
      throw new NotFoundError("Booking not found");
    }

    // Only allow user who owns the booking or admin/staff
    if (booking.userId !== user.id && user.role !== "ADMIN" && user.role !== "STAFF") {
      throw new NotFoundError("Booking not found");
    }

    if (existingPayment && existingPayment.status === "SUCCESS") {
      throw new ConflictError("A successful payment already exists for this booking");
    }

    // 4. Create payment record based on provider
    const paymentAmount = parseFloat(amount);

    if (provider === "RAZORPAY") {
      // Simulate Razorpay order creation
      const providerOrderId = `order_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;

      const payment = await prisma.payment.create({
        data: {
          bookingId,
          amount: paymentAmount,
          provider: "RAZORPAY",
          status: "PENDING",
          providerOrderId,
          metadata: JSON.stringify({
            simulatedOrder: true,
            createdAt: new Date().toISOString(),
          }),
        },
      });

      return {
        ...payment,
        amount: payment.amount.toString(),
        razorpayOrderId: providerOrderId,
        // Frontend needs these for Razorpay checkout
        orderDetails: {
          id: providerOrderId,
          amount: paymentAmount * 100, // Razorpay expects amount in paise
          currency: "INR",
        },
      };
    } else {
      // CASH or UPI — create payment directly
      const payment = await prisma.payment.create({
        data: {
          bookingId,
          amount: paymentAmount,
          provider,
          status: "PENDING",
          metadata: JSON.stringify({
            provider,
            createdAt: new Date().toISOString(),
          }),
        },
      });

      return {
        ...payment,
        amount: payment.amount.toString(),
      };
    }
  },
});
