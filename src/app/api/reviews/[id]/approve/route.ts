/**
 * Purpose: Review approval API endpoint
 * Responsibility: Approve or hide one review for admins and refresh staff rating
 * Important Notes: Mirrors review moderation behavior from the main review detail route.
 */

import { createApiHandler } from "@/lib/api-handler";
import { requireActiveUser } from "@/lib/auth-helpers";
import { AdminRequiredError, NotFoundError } from "@/lib/errors";
import { prisma } from "@/lib/prisma";
import { updateReviewSchema } from "@/lib/validations/reviews";

function extractReviewIdFromUrl(request: Request) {
  const url = new URL(request.url);
  const segments = url.pathname.split("/");
  const reviewsIndex = segments.indexOf("reviews");
  return reviewsIndex >= 0 ? segments[reviewsIndex + 1] || null : null;
}

// ==================== PATCH — Approve/Disapprove Review (Admin) ====================

export const PATCH = createApiHandler({
  schema: updateReviewSchema,
  successMessage: "Review updated successfully",
  handler: async ({ parsedBody, request }) => {
    const { user } = await requireActiveUser(request);
    if (user.role !== "ADMIN") {
      throw new AdminRequiredError();
    }

    const reviewId = extractReviewIdFromUrl(request);
    if (!reviewId) {
      throw new NotFoundError("Review not found");
    }

    const review = await prisma.review.findUnique({
      where: { id: reviewId },
    });

    if (!review) {
      throw new NotFoundError("Review not found");
    }

    const updatedReview = await prisma.review.update({
      where: { id: reviewId },
      data: { isApproved: parsedBody.isApproved },
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

    if (review.staffId) {
      const staffReviews = await prisma.review.findMany({
        where: { staffId: review.staffId, isApproved: true },
        select: { rating: true },
      });

      const avgRating = staffReviews.length > 0
        ? Math.round((staffReviews.reduce((sum, item) => sum + item.rating, 0) / staffReviews.length) * 100) / 100
        : 0;

      await prisma.staff.update({
        where: { id: review.staffId },
        data: { rating: avgRating },
      });
    }

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
