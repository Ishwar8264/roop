/**
 * Purpose: Service-specific reviews API endpoint
 * Responsibility: List reviews for a specific service (public, paginated)
 *
 * Endpoint:
 *   GET /api/services/[id]/reviews — List reviews for a service (public)
 *
 * GET Query Params:
 *   page     (default 1) — Page number
 *   pageSize (default 20, max 100) — Items per page
 *
 * GET Response:
 *   200: { success: true, data: { items, pagination, averageRating, totalReviews } }
 *   404: { success: false, error: "RES_NOT_FOUND" } — service not found
 */

import { createApiHandler } from "@/lib/api-handler";
import { prisma } from "@/lib/prisma";
import { NotFoundError } from "@/lib/errors";
import { HTTP_STATUS } from "@/lib/http";
import { pageParam, pageSizeParam } from "@/lib/validations/common";
import { z } from "zod";

// ==================== Helper — extract service [id] from URL ====================

function extractServiceIdFromUrl(request: Request): string | null {
  const url = new URL(request.url);
  const segments = url.pathname.split("/");
  const servicesIndex = segments.indexOf("services");
  if (servicesIndex === -1) return null;
  return segments[servicesIndex + 1] || null;
}

// ==================== Query Schema ====================

const serviceReviewsQuerySchema = z.object({
  page: pageParam,
  pageSize: pageSizeParam,
});

// ==================== GET — List Reviews for Service (Public) ====================

export const GET = createApiHandler({
  schema: null,
  handler: async ({ request }) => {
    const serviceId = extractServiceIdFromUrl(request);
    if (!serviceId) {
      throw new NotFoundError("Service not found");
    }

    // 1. Check service exists
    const service = await prisma.service.findUnique({
      where: { id: serviceId },
    });
    if (!service) {
      throw new NotFoundError("Service not found");
    }

    // 2. Parse query params
    const url = new URL(request.url);
    const queryResult = serviceReviewsQuerySchema.safeParse({
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

    const { page, pageSize } = queryResult.data;

    // 3. Build where — only approved reviews
    const where = {
      serviceId,
      isApproved: true,
    };

    // 4. Get aggregate rating info, total count, and paginated reviews
    const [ratingStats, total, reviews] = await Promise.all([
      prisma.review.aggregate({
        where,
        _avg: { rating: true },
        _count: { rating: true },
      }),
      prisma.review.count({ where }),
      prisma.review.findMany({
        where,
        select: {
          id: true,
          userId: true,
          bookingId: true,
          staffId: true,
          serviceId: true,
          rating: true,
          commentHi: true,
          commentEn: true,
          isApproved: true,
          createdAt: true,
          updatedAt: true,
          user: {
            select: {
              id: true,
              name: true,
              avatarUrl: true,
            },
          },
          staff: {
            select: {
              id: true,
              bioHi: true,
              bioEn: true,
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
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    // 7. Return with pagination and serialized decimals
    return {
      items: reviews.map((review) => ({
        ...review,
        staff: review.staff
          ? {
              ...review.staff,
              rating: review.staff.rating.toString(),
            }
          : null,
      })),
      averageRating: ratingStats._avg.rating
        ? Math.round(ratingStats._avg.rating * 100) / 100
        : 0,
      totalReviews: ratingStats._count.rating,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  },
});
