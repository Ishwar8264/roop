/**
 * Purpose: Loyalty points transaction history API endpoint
 * Responsibility: Get current user's loyalty transaction history (auth required, paginated)
 *
 * Endpoint:
 *   GET /api/loyalty/history — Get own transaction history (auth required)
 *
 * GET Query Params:
 *   type     (optional) — Filter by transaction type (EARN|REDEEM|EXPIRE)
 *   page     (default 1) — Page number
 *   pageSize (default 20, max 100) — Items per page
 *
 * GET Response:
 *   200: { success: true, data: { items, pagination } }
 *
 * Error Responses:
 *   401: { success: false, error: "AUTH_MISSING_TOKEN" }
 */

import { createApiHandler } from "@/lib/api-handler";
import { prisma } from "@/lib/prisma";
import { requireActiveUser } from "@/lib/auth-helpers";
import { HTTP_STATUS } from "@/lib/http";
import { listHistoryQuerySchema } from "@/lib/validations/loyalty";

// ==================== GET — Loyalty History (Auth Required) ====================

export const GET = createApiHandler({
  schema: null,
  handler: async ({ request }) => {
    // 1. Verify authenticated user
    const { user } = await requireActiveUser(request);

    // 2. Parse and validate query params
    const url = new URL(request.url);
    const queryResult = listHistoryQuerySchema.safeParse({
      type: url.searchParams.get("type") || undefined,
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

    const { type, page, pageSize } = queryResult.data;

    // 3. Build where clause — only user's own transactions
    const where: Record<string, unknown> = {
      userId: user.id,
    };
    if (type) where.type = type;

    // 4. Count total matching transactions
    const total = await prisma.loyaltyTransaction.count({ where });

    // 5. Fetch paginated transactions
    const transactions = await prisma.loyaltyTransaction.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    // 6. Return with pagination
    return {
      items: transactions,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  },
});
