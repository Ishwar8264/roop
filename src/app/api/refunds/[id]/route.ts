/**
 * Purpose: Process/approve/reject refund API endpoint
 * Responsibility: Update refund status — approve, reject, or process refund (admin only)
 *
 * Endpoint:
 *   PATCH /api/refunds/[id] — Process refund (admin only)
 *
 * PATCH Request Body:
 *   status         (required) — APPROVED | REJECTED | PROCESSED
 *   providerRefId  (optional) — Provider refund reference ID
 *
 * Processing Logic:
 *   - APPROVED: Marks refund as approved by admin
 *   - REJECTED: Marks refund as rejected
 *   - PROCESSED: Marks refund as fully processed, updates payment status to REFUNDED
 *                 and sets processedBy and processedAt
 *
 * Response:
 *   200: { success: true, data: refund, message }
 *   403: { success: false, error: "PERM_ADMIN_REQUIRED" }
 *   404: { success: false, error: "RES_NOT_FOUND" }
 *   409: { success: false, error: "RES_CONFLICT" }
 */

import { createApiHandler } from "@/lib/api-handler";
import { prisma } from "@/lib/prisma";
import { requireActiveUser } from "@/lib/auth-helpers";
import { NotFoundError, AdminRequiredError, ConflictError, ValidationError } from "@/lib/errors";
import { processRefundSchema } from "@/lib/validations/payments";

// ==================== Helper — extract [id] from URL ====================

function extractIdFromUrl(request: Request): string | null {
  const url = new URL(request.url);
  const segments = url.pathname.split("/");
  const idIndex = segments.indexOf("refunds") + 1;
  return segments[idIndex] || null;
}

// ==================== PATCH — Process Refund (Admin) ====================

export const PATCH = createApiHandler({
  schema: processRefundSchema,
  successMessage: "Refund processed successfully",
  handler: async ({ parsedBody, request }) => {
    const { status, providerRefId } = parsedBody;

    // 1. Verify admin access
    const { user } = await requireActiveUser(request);
    if (user.role !== "ADMIN") {
      throw new AdminRequiredError();
    }

    const id = extractIdFromUrl(request);
    if (!id) {
      throw new NotFoundError("Refund not found");
    }

    // 2. Check refund exists
    const refund = await prisma.refund.findUnique({
      where: { id },
      include: {
        payment: true,
      },
    });

    if (!refund) {
      throw new NotFoundError("Refund not found");
    }

    // 3. Validate status transitions
    if (refund.status === "PROCESSED") {
      throw new ConflictError("Refund has already been processed");
    }

    if (refund.status === "REJECTED" && status !== "REJECTED") {
      throw new ConflictError("Cannot change a rejected refund status");
    }

    if (refund.status === "APPROVED" && status === "APPROVED") {
      throw new ConflictError("Refund is already approved");
    }

    if (refund.status === "PENDING" && status === "PROCESSED") {
      throw new ValidationError("Refund must be approved before processing");
    }

    // 4. Build update data
    const updateData: Record<string, unknown> = {
      status,
      processedBy: user.id,
    };

    if (status === "PROCESSED" || status === "APPROVED") {
      updateData.processedAt = new Date();
    }

    if (providerRefId) {
      updateData.providerRefId = providerRefId;
    }

    // 5. Update refund record
    const updatedRefund = await prisma.refund.update({
      where: { id },
      data: updateData,
    });

    // 6. If refund is PROCESSED, update payment status to REFUNDED
    if (status === "PROCESSED") {
      await prisma.payment.update({
        where: { id: refund.paymentId },
        data: { status: "REFUNDED" },
      });
    }

    // 7. Return updated refund with serialized decimals
    return {
      ...updatedRefund,
      amount: updatedRefund.amount.toString(),
    };
  },
});
