/**
 * Purpose: Reviews list and create API endpoints
 * Responsibility: List reviews (public, paginated) and create review (auth required)
 *
 * Endpoints:
 *   GET  /api/reviews        — List reviews with pagination (public)
 *   POST /api/reviews        — Create a review (auth required)
 *
 * GET Query Params:
 *   serviceId  (optional) — Filter by service
 *   staffId    (optional) — Filter by staff
 *   rating     (optional) — Filter by rating (1-5)
 *   isApproved (optional) — Filter by approval status ("true"/"false")
 *   page       (default 1) — Page number
 *   pageSize   (default 20, max 100) — Items per page
 *
 * POST Request Body:
 *   bookingId (required) — Booking to review
 *   staffId   (optional) — Staff being reviewed
 *   rating    (required) — Star rating 1-5
 *   commentHi (optional) — Review text in Hindi
 *   commentEn (optional) — Review text in English
 *
 * Review Creation Logic:
 *   - Only allow one review per booking (bookingId unique constraint)
 *   - Only allow review for COMPLETED bookings
 *   - Validate rating is 1-5
 *   - After review, optionally update staff average rating
 *
 * Responses:
 *   200: { success: true, data: { items, pagination } }
 *   201: { success: true, data: review, message }
 *   400: { success: false, error, message }
 *   403: { success: false, error, message }
 *   409: { success: false, error: "RES_CONFLICT" }
 */

import { createApiHandler } from "@/lib/api-handler";
import { prisma } from "@/lib/prisma";
import { requireActiveUser } from "@/lib/auth-helpers";
import { NotFoundError, ConflictError, ForbiddenError } from "@/lib/errors";
import { HTTP_STATUS } from "@/lib/http";
import {
  createReviewSchema,
  listReviewsQuerySchema,
} from "@/lib/validations/reviews";

// ==================== GET — List Reviews (Public) ====================

export const GET = createApiHandler({
  schema: null,
  handler: async ({ request }) => {
    // 1. Parse and validate query params
    const url = new URL(request.url);
    const queryResult = listReviewsQuerySchema.safeParse({
      serviceId: url.searchParams.get("serviceId") || undefined,
      staffId: url.searchParams.get("staffId") || undefined,
      rating: url.searchParams.get("rating") || undefined,
      isApproved: url.searchParams.get("isApproved") || undefined,
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

    const { serviceId, staffId, rating, isApproved, page, pageSize } = queryResult.data;

    // 2. Build where clause — default to approved only for public
    const where: Record<string, unknown> = {};
    if (isApproved !== undefined) {
      where.isApproved = isApproved;
    } else {
      where.isApproved = true;
    }

    if (serviceId) where.serviceId = serviceId;
    if (staffId) where.staffId = staffId;
    if (rating) where.rating = rating;

    // 3. Count total and fetch paginated reviews
    const [total, reviews] = await Promise.all([
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
          service: {
            select: {
              id: true,
              nameHi: true,
              nameEn: true,
              price: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    // 5. Return with pagination and serialized decimals
    return {
      items: reviews.map((review) => ({
        ...review,
        service: {
          ...review.service,
          price: review.service.price.toString(),
        },
        staff: review.staff
          ? {
              ...review.staff,
              rating: review.staff.rating.toString(),
            }
          : null,
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

// ==================== POST — Create Review (Auth Required) ====================

export const POST = createApiHandler({
  schema: createReviewSchema,
  successMessage: "Review submitted successfully",
  successStatus: HTTP_STATUS.CREATED,
  handler: async ({ parsedBody, request }) => {
    const { bookingId, staffId, rating, commentHi, commentEn } = parsedBody;

    // 1. Verify authenticated user
    const { user } = await requireActiveUser(request);

    // 2. Check booking exists and belongs to user
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
    });

    if (!booking) {
      throw new NotFoundError("Booking not found");
    }

    if (booking.userId !== user.id) {
      throw new ForbiddenError("You can only review your own bookings");
    }

    // 3. Check booking is COMPLETED
    if (booking.status !== "COMPLETED") {
      throw new ConflictError("You can only review completed bookings");
    }

    // 4. Check if review already exists for this booking (one per booking)
    const existingReview = await prisma.review.findUnique({
      where: { bookingId },
    });

    if (existingReview) {
      throw new ConflictError("A review already exists for this booking");
    }

    // 5. Validate staffId if provided
    if (staffId) {
      const staff = await prisma.staff.findUnique({
        where: { id: staffId },
      });
      if (!staff) {
        throw new NotFoundError("Staff not found");
      }
    }

    // 6. Create review
    const review = await prisma.review.create({
      data: {
        userId: user.id,
        bookingId,
        staffId: staffId || null,
        serviceId: booking.serviceId,
        rating,
        commentHi: commentHi || null,
        commentEn: commentEn || null,
        isApproved: true, // Auto-approve by default
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
        service: {
          select: {
            id: true,
            nameHi: true,
            nameEn: true,
            price: true,
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
    });

    // 7. Update staff average rating if staffId was provided
    if (staffId) {
      const staffReviews = await prisma.review.findMany({
        where: { staffId, isApproved: true },
        select: { rating: true },
      });

      if (staffReviews.length > 0) {
        const avgRating = staffReviews.reduce((sum, r) => sum + r.rating, 0) / staffReviews.length;
        await prisma.staff.update({
          where: { id: staffId },
          data: { rating: Math.round(avgRating * 100) / 100 },
        });
      }
    }

    // 8. Return created review with serialized decimals
    return {
      ...review,
      service: {
        ...review.service,
        price: review.service.price.toString(),
      },
      staff: review.staff
        ? {
            ...review.staff,
            rating: review.staff.rating.toString(),
          }
        : null,
    };
  },
});
