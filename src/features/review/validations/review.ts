/**
 * Purpose: Zod validation schemas for review API routes
 * Responsibility: Validate all review submission and moderation API inputs
 * Important Notes:
 *   - One schema per API endpoint
 *   - Export both schema and inferred type
 *   - Hindi-first error messages
 *   - Rating must be 1-5
 *   - staffId and serviceId are NOT accepted from frontend — auto-filled from booking
 */

import { z } from "zod";

// ==================== SUBMIT REVIEW ====================

/** Body for POST /api/reviews */
export const submitReviewSchema = z.object({
  bookingId: z
    .string()
    .min(1, "बुकिंग ID आवश्यक है / Booking ID is required"),
  rating: z
    .number()
    .int("रेटिंग पूर्णांक होनी चाहिए / Rating must be an integer")
    .min(1, "रेटिंग न्यूनतम 1 होनी चाहिए / Rating must be at least 1")
    .max(5, "रेटिंग अधिकतम 5 हो सकती है / Rating must be at most 5"),
  commentHi: z
    .string()
    .max(2000, "टिप्पणी 2000 अक्षरों से कम होनी चाहिए / Comment must be under 2000 characters")
    .trim()
    .optional(),
  commentEn: z
    .string()
    .max(2000, "Comment must be under 2000 characters")
    .trim()
    .optional(),
});

export type SubmitReviewInput = z.infer<typeof submitReviewSchema>;

// ==================== APPROVE REVIEW ====================

/** Body for PATCH /api/reviews/[id]/approve */
export const approveReviewSchema = z.object({
  isApproved: z
    .boolean()
    .refine((val) => val !== undefined, {
      message: "isApproved फ़ील्ड आवश्यक है / isApproved field is required",
    }),
});

export type ApproveReviewInput = z.infer<typeof approveReviewSchema>;
