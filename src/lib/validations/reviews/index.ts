/**
 * Purpose: Zod validation schemas for Reviews API routes
 * Responsibility: Validate all review API inputs using shared primitives
 * Important Notes:
 *   - Uses common schemas from validations/common.ts
 *   - One schema per API endpoint
 *   - Export both schema and inferred type
 *   - Rating must be integer 1-5
 *   - One review per booking (bookingId unique constraint)
 */

import { z } from "zod";
import { cuid, pageParam, pageSizeParam } from "../common";

// ==================== CREATE REVIEW ====================

/** POST /api/reviews */
export const createReviewSchema = z.object({
  bookingId: cuid,
  staffId: cuid.optional(),
  rating: z
    .number()
    .int("Rating must be an integer")
    .min(1, "Rating must be at least 1")
    .max(5, "Rating must be at most 5"),
  commentHi: z.string().max(2000, "Comment must be 2000 characters or less").optional(),
  commentEn: z.string().max(2000, "Comment must be 2000 characters or less").optional(),
});

export type CreateReviewInput = z.infer<typeof createReviewSchema>;

// ==================== LIST REVIEWS QUERY ====================

/** GET /api/reviews — query params */
export const listReviewsQuerySchema = z.object({
  serviceId: cuid.optional(),
  staffId: cuid.optional(),
  rating: z.coerce.number().int().min(1).max(5).optional(),
  isApproved: z
    .enum(["true", "false"])
    .optional()
    .transform((v) => (v === "true" ? true : v === "false" ? false : undefined)),
  page: pageParam,
  pageSize: pageSizeParam,
});

export type ListReviewsQueryInput = z.infer<typeof listReviewsQuerySchema>;

// ==================== UPDATE REVIEW (Admin) ====================

/** PATCH /api/reviews/[id] — admin approve/disapprove */
export const updateReviewSchema = z.object({
  isApproved: z.boolean(),
});

export type UpdateReviewInput = z.infer<typeof updateReviewSchema>;
