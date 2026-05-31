/**
 * Purpose: Verify payment API endpoint
 * Responsibility: Verify Razorpay payment and update booking status (auth required)
 *
 * Endpoint:
 *   POST /api/payments/verify — Verify payment and mark as successful (auth required)
 *
 * POST Request Body:
 *   paymentId      (required) — Internal payment record ID
 *   providerRefId  (required) — Provider payment reference ID (e.g., Razorpay payment_id)
 *   providerOrderId (required) — Provider order ID (e.g., Razorpay order_id)
 *
 * Verification Logic:
 *   - Find payment by internal ID
 *   - Verify providerOrderId matches the one stored
 *   - Update payment status to SUCCESS
 *   - Set paidAt timestamp
 *   - Update booking status to CONFIRMED
 *   - Store provider references in metadata
 *
 * Response:
 *   200: { success: true, data: payment, message }
 *   400: { success: false, error, message }
 *   404: { success: false, error: "RES_NOT_FOUND" }
 *   409: { success: false, error: "RES_CONFLICT" }
 */

import { createApiHandler } from "@/lib/api-handler";
import { prisma } from "@/lib/prisma";
import { requireActiveUser } from "@/lib/auth-helpers";
import { NotFoundError, ConflictError, ValidationError } from "@/lib/errors";
import { verifyPaymentSchema } from "@/lib/validations/payments";

// ==================== POST — Verify Payment (Auth Required) ====================

export const POST = createApiHandler({
  schema: verifyPaymentSchema,
  successMessage: "Payment verified successfully",
  handler: async ({ parsedBody, request }) => {
    const { paymentId, providerRefId, providerOrderId } = parsedBody;

    // 1. Verify authenticated user
    const { user } = await requireActiveUser(request);

    // 2. Find payment record
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        booking: {
          select: {
            id: true,
            userId: true,
            status: true,
          },
        },
      },
    });

    if (!payment) {
      throw new NotFoundError("Payment not found");
    }

    // 3. Verify user owns this payment's booking (or is admin/staff)
    if (payment.booking.userId !== user.id && user.role !== "ADMIN" && user.role !== "STAFF") {
      throw new NotFoundError("Payment not found");
    }

    // 4. Check payment is in PENDING state
    if (payment.status !== "PENDING") {
      throw new ConflictError("Payment has already been processed");
    }

    // 5. Verify providerOrderId matches (for Razorpay)
    if (payment.providerOrderId && payment.providerOrderId !== providerOrderId) {
      throw new ValidationError("Provider order ID does not match");
    }

    // 6. Update payment to SUCCESS
    const updatedPayment = await prisma.payment.update({
      where: { id: paymentId },
      data: {
        status: "SUCCESS",
        providerRefId,
        providerOrderId,
        paidAt: new Date(),
        metadata: {
          ...(typeof payment.metadata === "object" && payment.metadata !== null ? payment.metadata as Record<string, unknown> : {}),
          verifiedAt: new Date().toISOString(),
          providerRefId,
        },
      },
    });

    // 7. Update booking status to CONFIRMED
    await prisma.booking.update({
      where: { id: payment.bookingId },
      data: { status: "CONFIRMED" },
    });

    // 8. Create booking status history record
    await prisma.bookingStatusHistory.create({
      data: {
        bookingId: payment.bookingId,
        status: "CONFIRMED",
        changedBy: user.id,
        reason: "Payment verified and confirmed",
      },
    });

    // 9. Return verified payment with serialized decimals
    return {
      ...updatedPayment,
      amount: updatedPayment.amount.toString(),
    };
  },
});
