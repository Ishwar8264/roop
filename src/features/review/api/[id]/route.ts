/**
 * Purpose: Review detail + delete endpoints
 * Endpoints:
 *   GET    /api/reviews/[id] — Get review detail (Public)
 *   DELETE /api/reviews/[id] — Delete review (USER own or ADMIN)
 */

import { createApiHandler } from "@/lib/server/api-handler";
import {
  getReviewById,
  deleteReview,
  requireAuth,
  extractReviewIdFromUrl,
} from "@/features/review/services/review-service";

// ==================== GET — REVIEW DETAIL (PUBLIC) ====================

export const GET = createApiHandler<null, Awaited<ReturnType<typeof getReviewById>>>({
  schema: null,
  handler: async ({ request }) => {
    const reviewId = extractReviewIdFromUrl(request.url);
    return getReviewById(reviewId);
  },
  successMessage: "समीक्षा विवरण सफलतापूर्वक प्राप्त हुआ। / Review detail fetched successfully.",
});

// ==================== DELETE — DELETE REVIEW (USER OWN OR ADMIN) ====================

export const DELETE = createApiHandler<null, Awaited<ReturnType<typeof deleteReview>>>({
  schema: null,
  authHook: requireAuth,
  handler: async ({ request, auth }) => {
    const reviewId = extractReviewIdFromUrl(request.url);
    const userId = auth!.payload.userId;
    const userRole = auth!.user!.role;

    return deleteReview(reviewId, userId, userRole);
  },
  successMessage: "समीक्षा सफलतापूर्वक हटाई गई। / Review deleted successfully.",
});
