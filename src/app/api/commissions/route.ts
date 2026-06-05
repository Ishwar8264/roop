/**
 * Purpose: Staff Commissions list API endpoint
 * Responsibility: List staff commission records with pagination (admin only)
 *
 * Endpoints:
 *   GET  /api/commissions        — List staff commissions with pagination (admin only)
 *
 * GET Query Params:
 *   staffId   (optional) — Filter by staff member
 *   status    (optional) — Filter by commission status (PENDING|PAID)
 *   page      (default 1) — Page number
 *   pageSize  (default 20, max 100) — Items per page
 *
 * Responses:
 *   200: { success: true, data: { items, pagination } }
 *   403: { success: false, error: "PERM_ADMIN_REQUIRED", message }
 */

import { createApiHandler } from "@/lib/api-handler";
import { prisma } from "@/lib/prisma";
import { requireActiveUser } from "@/lib/auth-helpers";
import { AdminRequiredError } from "@/lib/errors";
import { HTTP_STATUS } from "@/lib/http";
import { listCommissionsQuerySchema } from "@/lib/validations/commissions";

// ==================== GET — List Commissions (Admin) ====================

export const GET = createApiHandler({
  schema: null,
  handler: async ({ request }) => {
    // 1. Verify admin access
    const { user } = await requireActiveUser(request);
    if (user.role !== "ADMIN") {
      throw new AdminRequiredError();
    }

    // 2. Parse and validate query params
    const url = new URL(request.url);
    const queryResult = listCommissionsQuerySchema.safeParse({
      staffId: url.searchParams.get("staffId") || undefined,
      status: url.searchParams.get("status") || undefined,
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

    const { staffId, status, page, pageSize } = queryResult.data;

    // 3. Build where clause
    const where: Record<string, unknown> = {};
    if (staffId) where.staffId = staffId;
    if (status) where.status = status;

    // 4. Count total and fetch paginated commissions
    const [total, items] = await Promise.all([
      prisma.staffCommission.count({ where }),
      prisma.staffCommission.findMany({
        where,
        select: {
          id: true,
          staffId: true,
          bookingId: true,
          amount: true,
          rate: true,
          status: true,
          paidAt: true,
          createdAt: true,
          updatedAt: true,
          staff: {
            select: {
              id: true,
              userId: true,
              specialization: true,
              user: {
                select: {
                  id: true,
                  name: true,
                  mobile: true,
                },
              },
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
      items: items.map((item) => ({
        ...item,
        amount: item.amount.toString(),
        rate: item.rate.toString(),
        paidAt: item.paidAt?.toISOString() ?? null,
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
