/**
 * Purpose: Review detail and admin moderation API endpoint
 * Responsibility: Get review detail (public), approve/disapprove review (admin)
 *
 * Endpoints:
 *   GET   /api/reviews/[id]  — Get review detail (public)
 *   PATCH /api/reviews/[id]  — Approve/disapprove review (admin only)
 *
 * GET Response:
 *   200: { success: true, data: review } — Full review with user, staff, and service details
 *
 * PATCH Request Body:
 *   isApproved (required) — true to approve, false to disapprove
 *
 * PATCH Logic:
 *   - When disapproving a review, recalculate staff average rating
 *   - When approving a previously disapproved review, recalculate staff average rating
 *
 * Error Responses:
 *   403: { success: false, error: "PERM_ADMIN_REQUIRED" }
 *   404: { success: false, error: "RES_NOT_FOUND" }
 */

import { createApiHandler } from "@/lib/api-handler";
import { prisma } from "@/lib/prisma";
import { requireActiveUser } from "@/lib/auth-helpers";
import { NotFoundError, AdminRequiredError } from "@/lib/errors";
import { updateReviewSchema } from "@/lib/validations/reviews";

// ==================== Helper — extract [id] from URL ====================

function extractIdFromUrl(request: Request): string | null {
  const url = new URL(request.url);
  const segments = url.pathname.split("/");
  const idIndex = segments.indexOf("reviews") + 1;
  return segments[idIndex] || null;
}

// ==================== GET — Review Detail (Public) ====================

export const GET = createApiHandler({
  schema: null,
  handler: async ({ request }) => {
    const id = extractIdFromUrl(request);
    if (!id) {
      throw new NotFoundError("Review not found");
    }

    const review = await prisma.review.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
        booking: {
          select: {
            id: true,
            bookingDisplayId: true,
            totalAmount: true,
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
    });

    if (!review) {
      throw new NotFoundError("Review not found");
    }

    // Return with serialized decimal values
    return {
      ...review,
      booking: {
        ...review.booking,
        totalAmount: review.booking.totalAmount.toString(),
      },
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

// ==================== PATCH — Approve/Disapprove Review (Admin) ====================

export const PATCH = createApiHandler({
  schema: updateReviewSchema,
  successMessage: "Review updated successfully",
  handler: async ({ parsedBody, request }) => {
    const { isApproved } = parsedBody;

    // 1. Verify admin access
    const { user } = await requireActiveUser(request);
    if (user.role !== "ADMIN") {
      throw new AdminRequiredError();
    }

    const id = extractIdFromUrl(request);
    if (!id) {
      throw new NotFoundError("Review not found");
    }

    // 2. Check review exists
    const review = await prisma.review.findUnique({
      where: { id },
    });

    if (!review) {
      throw new NotFoundError("Review not found");
    }

    // 3. Update review approval status
    const updatedReview = await prisma.review.update({
      where: { id },
      data: { isApproved },
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

    // 4. Recalculate staff average rating if staffId is present
    if (review.staffId) {
      const staffReviews = await prisma.review.findMany({
        where: { staffId: review.staffId, isApproved: true },
        select: { rating: true },
      });

      const avgRating = staffReviews.length > 0
        ? Math.round((staffReviews.reduce((sum, r) => sum + r.rating, 0) / staffReviews.length) * 100) / 100
        : 0;

      await prisma.staff.update({
        where: { id: review.staffId },
        data: { rating: avgRating },
      });
    }

    // 5. Return updated review with serialized decimals
    return {
      ...updatedReview,
      service: {
        ...updatedReview.service,
        price: updatedReview.service.price.toString(),
      },
      staff: updatedReview.staff
        ? {
            ...updatedReview.staff,
            rating: updatedReview.staff.rating.toString(),
          }
        : null,
    };
  },
});
