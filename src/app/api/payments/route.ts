/**
 * Purpose: Payments list API endpoint
 * Responsibility: List payments with pagination and filters (admin/staff only)
 *
 * Endpoint:
 *   GET /api/payments — List payments with pagination (admin/staff)
 *
 * GET Query Params:
 *   bookingId (optional) — Filter by booking
 *   status    (optional) — Filter by payment status (PENDING|SUCCESS|FAILED|REFUNDED)
 *   provider  (optional) — Filter by payment provider (RAZORPAY|CASH|UPI)
 *   page      (default 1) — Page number
 *   pageSize  (default 20, max 100) — Items per page
 *
 * Response:
 *   200: { success: true, data: { items, pagination } }
 *   403: { success: false, error: "PERM_ADMIN_REQUIRED" }
 */

import { createApiHandler } from "@/lib/api-handler";
import { prisma } from "@/lib/prisma";
import { requireActiveUser } from "@/lib/auth-helpers";
import { AdminRequiredError, StaffRequiredError } from "@/lib/errors";
import { HTTP_STATUS } from "@/lib/http";
import { listPaymentsQuerySchema } from "@/lib/validations/payments";

// ==================== GET — List Payments (Admin/Staff) ====================

export const GET = createApiHandler({
  schema: null,
  handler: async ({ request }) => {
    // 1. Verify admin or staff access
    const { user } = await requireActiveUser(request);
    if (user.role !== "ADMIN" && user.role !== "STAFF") {
      throw new StaffRequiredError();
    }

    // 2. Parse and validate query params
    const url = new URL(request.url);
    const queryResult = listPaymentsQuerySchema.safeParse({
      bookingId: url.searchParams.get("bookingId") || undefined,
      status: url.searchParams.get("status") || undefined,
      provider: url.searchParams.get("provider") || undefined,
      page: url.searchParams.get("page") || undefined,
      pageSize: url.searchParams.get("pageSize") || undefined,
    });

    if (!queryResult.success) {
      const firstIssue = queryResult.error.issues[0];
      const fieldPath = firstIssue.path.join(".");
      const message = fieldPath
        ? `${fieldPath}: ${firstIssue.message}`
        : firstIssue.message;

      return Response.json(
        {
          success: false,
          error: "VAL_INVALID_INPUT",
          message,
          statusCode: HTTP_STATUS.BAD_REQUEST,
        },
        { status: HTTP_STATUS.BAD_REQUEST }
      );
    }

    const { bookingId, status, provider, page, pageSize } = queryResult.data;

    // 3. Build where clause
    const where: Record<string, unknown> = {};
    if (bookingId) where.bookingId = bookingId;
    if (status) where.status = status;
    if (provider) where.provider = provider;

    // 4. Count total and fetch paginated payments
    const [total, payments] = await Promise.all([
      prisma.payment.count({ where }),
      prisma.payment.findMany({
        where,
        select: {
          id: true,
          bookingId: true,
          amount: true,
          provider: true,
          status: true,
          providerRefId: true,
          providerOrderId: true,
          receiptUrl: true,
          metadata: true,
          paidAt: true,
          createdAt: true,
          updatedAt: true,
          booking: {
            select: {
              id: true,
              bookingDisplayId: true,
              totalAmount: true,
              status: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    // 6. Return with pagination and serialized decimals
    return {
      items: payments.map((payment) => ({
        ...payment,
        amount: payment.amount.toString(),
        booking: {
          ...payment.booking,
          totalAmount: payment.booking.totalAmount.toString(),
        },
      })),
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  },
});
