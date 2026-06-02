/**
 * Purpose: Review list + submit endpoints
 * Endpoints:
 *   GET  /api/reviews  — List reviews (Public, only approved)
 *   POST /api/reviews  — Submit review (Authenticated USER)
 */

import { createApiHandler } from "@/lib/server/api-handler";
import { submitReviewSchema } from "@/features/review/validations/review";
import {
  listReviews,
  submitReview,
  requireAuth,
} from "@/features/review/services/review-service";
import type { SubmitReviewInput } from "@/features/review/validations/review";
import type { ReviewListQuery } from "@/features/review/types";

// ==================== GET — LIST REVIEWS (PUBLIC) ====================

export const GET = createApiHandler<null, Awaited<ReturnType<typeof listReviews>>>({
  schema: null,
  handler: async ({ request }) => {
    const url = new URL(request.url);

    const serviceId = url.searchParams.get("serviceId") || undefined;
    const staffId = url.searchParams.get("staffId") || undefined;
    const ratingParam = url.searchParams.get("rating");
    const rating = ratingParam ? parseInt(ratingParam, 10) : undefined;
    const page = parseInt(url.searchParams.get("page") || "1", 10);
    const limit = parseInt(url.searchParams.get("limit") || "20", 10);

    // Validate pagination params
    const validPage = Math.max(1, isNaN(page) ? 1 : page);
    const validLimit = Math.min(100, Math.max(1, isNaN(limit) ? 20 : limit));

    // Validate rating
    const validRating = rating && rating >= 1 && rating <= 5 ? rating : undefined;

    return listReviews({
      serviceId,
      staffId,
      rating: validRating,
      page: validPage,
      limit: validLimit,
    });
  },
  successMessage: "समीक्षाएं सफलतापूर्वक प्राप्त हुईं। / Reviews fetched successfully.",
});

// ==================== POST — SUBMIT REVIEW (AUTHENTICATED USER) ====================

export const POST = createApiHandler<SubmitReviewInput, Awaited<ReturnType<typeof submitReview>>>({
  schema: submitReviewSchema,
  authHook: requireAuth,
  handler: async ({ parsedBody, auth }) => {
    const userId = auth!.payload.userId;
    return submitReview(parsedBody, userId);
  },
  successMessage: "समीक्षा सफलतापूर्वक जमा की गई। / Review submitted successfully.",
  successStatus: 201,
});
