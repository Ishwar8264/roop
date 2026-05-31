/**
 * Purpose: Create refund request API endpoint
 * Responsibility: Create a refund request for a payment (admin only)
 *
 * Endpoint:
 *   POST /api/refunds — Create refund request (admin only)
 *
 * POST Request Body:
 *   paymentId (required) — Payment to refund
 *   amount    (required) — Refund amount (decimal string, must not exceed payment amount)
 *   reason    (required) — Reason for refund
 *
 * Refund Creation Logic:
 *   - Validates payment exists and is in SUCCESS status
 *   - Validates refund amount does not exceed payment amount
 *   - Creates Refund record with PENDING status
 *   - Does NOT process the refund — admin must approve/process separately
 *
 * Response:
 *   201: { success: true, data: refund, message }
 *   400: { success: false, error, message }
 *   403: { success: false, error: "PERM_ADMIN_REQUIRED" }
 *   404: { success: false, error: "RES_NOT_FOUND" }
 *   409: { success: false, error: "RES_CONFLICT" }
 */

import { createApiHandler } from "@/lib/api-handler";
import { prisma } from "@/lib/prisma";
import { requireActiveUser } from "@/lib/auth-helpers";
import { NotFoundError, AdminRequiredError, ConflictError, ValidationError } from "@/lib/errors";
import { HTTP_STATUS } from "@/lib/http";
import { createRefundSchema } from "@/lib/validations/payments";

// ==================== POST — Create Refund (Admin) ====================

export const POST = createApiHandler({
  schema: createRefundSchema,
  successMessage: "Refund request created successfully",
  successStatus: HTTP_STATUS.CREATED,
  handler: async ({ parsedBody, request }) => {
    const { paymentId, amount, reason } = parsedBody;

    // 1. Verify admin access
    const { user } = await requireActiveUser(request);
    if (user.role !== "ADMIN") {
      throw new AdminRequiredError();
    }

    // 2. Check payment exists
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        refunds: true,
      },
    });

    if (!payment) {
      throw new NotFoundError("Payment not found");
    }

    // 3. Check payment is in SUCCESS status
    if (payment.status !== "SUCCESS") {
      throw new ConflictError("Can only refund successful payments");
    }

    // 4. Validate refund amount does not exceed payment amount
    const refundAmount = parseFloat(amount);
    const paymentAmount = parseFloat(payment.amount.toString());

    // Calculate total already refunded
    const alreadyRefunded = payment.refunds
      .filter((r) => r.status === "APPROVED" || r.status === "PROCESSED")
      .reduce((sum, r) => sum + parseFloat(r.amount.toString()), 0);

    if (refundAmount + alreadyRefunded > paymentAmount) {
      throw new ValidationError(
        `Refund amount (₹${refundAmount}) plus already refunded (₹${alreadyRefunded}) exceeds payment amount (₹${paymentAmount})`
      );
    }

    // 5. Create refund record
    const refund = await prisma.refund.create({
      data: {
        paymentId,
        amount: refundAmount,
        reason,
        status: "PENDING",
      },
    });

    // 6. Return created refund with serialized decimals
    return {
      ...refund,
      amount: refund.amount.toString(),
    };
  },
});
