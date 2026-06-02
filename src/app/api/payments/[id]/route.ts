/**
 * Purpose: Payment detail API endpoint
 * Responsibility: Get payment detail (admin/staff only)
 *
 * Endpoint:
 *   GET /api/payments/[id] — Get payment detail with booking and refund info
 *
 * GET Response:
 *   200: { success: true, data: payment } — Full payment with booking and refunds
 *
 * Error Responses:
 *   403: { success: false, error: "PERM_STAFF_REQUIRED" }
 *   404: { success: false, error: "RES_NOT_FOUND" }
 */

import { createApiHandler } from "@/lib/api-handler";
import { prisma } from "@/lib/prisma";
import { requireActiveUser } from "@/lib/auth-helpers";
import { NotFoundError, StaffRequiredError } from "@/lib/errors";

// ==================== Helper — extract [id] from URL ====================

function extractIdFromUrl(request: Request): string | null {
  const url = new URL(request.url);
  const segments = url.pathname.split("/");
  const idIndex = segments.indexOf("payments") + 1;
  return segments[idIndex] || null;
}

// ==================== GET — Payment Detail (Admin/Staff) ====================

export const GET = createApiHandler({
  schema: null,
  handler: async ({ request }) => {
    // 1. Verify admin or staff access
    const { user } = await requireActiveUser(request);
    if (user.role !== "ADMIN" && user.role !== "STAFF") {
      throw new StaffRequiredError();
    }

    const id = extractIdFromUrl(request);
    if (!id) {
      throw new NotFoundError("Payment not found");
    }

    // 2. Fetch payment with booking and refunds
    const payment = await prisma.payment.findUnique({
      where: { id },
      include: {
        booking: {
          select: {
            id: true,
            bookingDisplayId: true,
            totalAmount: true,
            status: true,
            userId: true,
          },
        },
        refunds: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!payment) {
      throw new NotFoundError("Payment not found");
    }

    // 3. Return with serialized decimal values
    return {
      ...payment,
      amount: payment.amount.toString(),
      booking: {
        ...payment.booking,
        totalAmount: payment.booking.totalAmount.toString(),
      },
      refunds: payment.refunds.map((refund) => ({
        ...refund,
        amount: refund.amount.toString(),
      })),
    };
  },
});
