/**
 * Purpose: Approve/hide review endpoint
 * Endpoint:
 *   PATCH /api/reviews/[id]/approve — Approve/hide review (ADMIN only)
 */

import { createApiHandler } from "@/lib/server/api-handler";
import { approveReviewSchema } from "@/features/review/validations/review";
import {
  approveReview,
  requireAdmin,
  extractReviewIdFromUrl,
} from "@/features/review/services/review-service";
import type { ApproveReviewInput } from "@/features/review/validations/review";

// ==================== PATCH — APPROVE/HIDE REVIEW (ADMIN ONLY) ====================

export const PATCH = createApiHandler<ApproveReviewInput, Awaited<ReturnType<typeof approveReview>>>({
  schema: approveReviewSchema,
  authHook: requireAdmin,
  handler: async ({ parsedBody, request }) => {
    const reviewId = extractReviewIdFromUrl(request.url);
    return approveReview(reviewId, parsedBody.isApproved);
  },
  successMessage: "समीक्षा स्थिति सफलतापूर्वक अपडेट की गई। / Review status updated successfully.",
});
