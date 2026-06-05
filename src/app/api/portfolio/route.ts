/**
 * Purpose: Portfolio list API endpoint
 * Responsibility: List all portfolio items with pagination (public access)
 *
 * Endpoints:
 *   GET  /api/portfolio  — List all portfolio items with pagination (public)
 *
 * GET Query Params:
 *   staffId  (optional) — Filter by staff member
 *   page     (default 1) — Page number
 *   pageSize (default 20, max 100) — Items per page
 *
 * Responses:
 *   200: { success: true, data: { items, pagination } }
 *   400: { success: false, error, message }
 */

import { createApiHandler } from "@/lib/api-handler";
import { prisma } from "@/lib/prisma";
import { HTTP_STATUS } from "@/lib/http";
import { listPortfolioQuerySchema } from "@/lib/validations/portfolio";

// ==================== GET — List Portfolio Items (Public) ====================

export const GET = createApiHandler({
  schema: null, // No body — query params parsed manually
  handler: async ({ request }) => {
    // 1. Parse and validate query params
    const url = new URL(request.url);
    const queryResult = listPortfolioQuerySchema.safeParse({
      staffId: url.searchParams.get("staffId") || undefined,
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

    const { staffId, page, pageSize } = queryResult.data;

    // 2. Build where clause
    const where: Record<string, unknown> = {};
    if (staffId) {
      where.staffId = staffId;
    }

    // 3. Count total and fetch paginated portfolio items with staff info
    const [total, items] = await Promise.all([
      prisma.portfolioItem.count({ where }),
      prisma.portfolioItem.findMany({
        where,
        select: {
          id: true,
          staffId: true,
          titleHi: true,
          titleEn: true,
          imageUrl: true,
          isFeatured: true,
          createdAt: true,
          staff: {
            select: {
              id: true,
              bioHi: true,
              bioEn: true,
              photoUrl: true,
              rating: true,
              user: {
                select: {
                  id: true,
                  name: true,
                  avatarUrl: true,
                },
              },
            },
          },
        },
        orderBy: [
          { isFeatured: "desc" },
          { createdAt: "desc" },
        ],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    // 5. Return with pagination and serialized decimals
    return {
      items: items.map((item) => ({
        ...item,
        staff: {
          ...item.staff,
          rating: item.staff.rating.toString(),
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
