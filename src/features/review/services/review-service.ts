/**
 * Purpose: Review business logic service
 * Responsibility: All review CRUD operations + moderation (approve/hide)
 * Important Notes:
 *   - Business logic lives HERE, NOT in route handlers
 *   - One review per booking (bookingId is unique on Review)
 *   - Auto-fill: staffId and serviceId from booking — never trust frontend
 *   - Only COMPLETED bookings can be reviewed
 *   - Booking must belong to the user submitting the review
 *   - isApproved defaults to true; admin can hide inappropriate reviews
 *   - Public listing: only approved reviews (isApproved=true)
 *   - Hindi-first user-facing messages in errors
 *   - URL-based ID extraction from request.url pathname
 */

import { prisma } from "@/lib/database/prisma";
import { requireAdmin, requireAuth } from "@/lib/server/auth-hooks";
import {
  ReviewNotFoundError,
  ReviewAlreadyExistsError,
  ReviewBookingNotCompletedError,
  ReviewUnauthorizedError,
  ReviewBookingNotOwnedError,
  BookingNotFoundError,
} from "@/lib/server/errors";
import type {
  ReviewResponse,
  ReviewListResponse,
  ReviewListQuery,
  SubmitReviewResponse,
  ApproveReviewResponse,
  DeleteReviewResponse,
} from "@/features/review/types";
import type { SubmitReviewInput } from "@/features/review/validations/review";
import { Prisma } from "@prisma/client";

// Re-export auth hooks for convenience in route files
export { requireAdmin, requireAuth };

// ==================== URL HELPERS ====================

/**
 * Extract review ID from URL pathname
 * Works for /api/reviews/[id]/... patterns
 */
export function extractReviewIdFromUrl(url: string): string {
  const pathname = new URL(url).pathname;
  const segments = pathname.split("/").filter(Boolean);
  // /api/reviews/[id]/... → segments: ['api', 'reviews', 'id', ...]
  return segments[2] || "";
}

// ==================== MAPPER ====================

/** Map Prisma Review (with relations) to API response */
function mapReviewToResponse(review: {
  id: string;
  userId: string;
  bookingId: string;
  staffId: string | null;
  serviceId: string;
  rating: number;
  commentHi: string | null;
  commentEn: string | null;
  isApproved: boolean;
  createdAt: Date;
  updatedAt: Date;
  user: { name: string | null };
  staff: { user: { name: string | null } } | null;
  service: { nameHi: string; nameEn: string };
}): ReviewResponse {
  return {
    id: review.id,
    userId: review.userId,
    userName: review.user.name,
    bookingId: review.bookingId,
    staffId: review.staffId,
    staffName: review.staff?.user?.name ?? null,
    serviceId: review.serviceId,
    serviceNameHi: review.service.nameHi,
    serviceNameEn: review.service.nameEn,
    rating: review.rating,
    commentHi: review.commentHi,
    commentEn: review.commentEn,
    isApproved: review.isApproved,
    createdAt: review.createdAt.toISOString(),
    updatedAt: review.updatedAt.toISOString(),
  };
}

// ==================== SUBMIT REVIEW ====================

/**
 * Submit a review for a completed booking
 * Auth: any authenticated user
 * Auto-fills: staffId from booking, serviceId from booking
 * Validates: booking is COMPLETED, booking belongs to user, no existing review
 */
export async function submitReview(
  data: SubmitReviewInput,
  userId: string
): Promise<SubmitReviewResponse> {
  // 1. Validate booking exists
  const booking = await prisma.booking.findUnique({
    where: { id: data.bookingId },
    select: {
      id: true,
      userId: true,
      status: true,
      staffId: true,
      serviceId: true,
    },
  });

  if (!booking) {
    throw new BookingNotFoundError();
  }

  // 2. Check booking belongs to user
  if (booking.userId !== userId) {
    throw new ReviewBookingNotOwnedError();
  }

  // 3. Check booking is COMPLETED
  if (booking.status !== "COMPLETED") {
    throw new ReviewBookingNotCompletedError();
  }

  // 4. Check no existing review for this booking
  const existingReview = await prisma.review.findUnique({
    where: { bookingId: data.bookingId },
    select: { id: true },
  });

  if (existingReview) {
    throw new ReviewAlreadyExistsError();
  }

  // 5. Create review with auto-filled staffId and serviceId
  const review = await prisma.review.create({
    data: {
      userId,
      bookingId: data.bookingId,
      staffId: booking.staffId,
      serviceId: booking.serviceId,
      rating: data.rating,
      commentHi: data.commentHi ?? null,
      commentEn: data.commentEn ?? null,
      isApproved: true, // Default to approved
    },
  });

  return {
    id: review.id,
    bookingId: review.bookingId,
    rating: review.rating,
    isApproved: review.isApproved,
    createdAt: review.createdAt.toISOString(),
  };
}

// ==================== LIST REVIEWS ====================

/**
 * List reviews with filtering and pagination
 * Public: only approved reviews (isApproved=true)
 * Supports filtering by serviceId, staffId, rating
 */
export async function listReviews(
  query: ReviewListQuery
): Promise<ReviewListResponse> {
  const { serviceId, staffId, rating, page = 1, limit = 20 } = query;

  const where: Prisma.ReviewWhereInput = {
    isApproved: true, // Public: only approved reviews
  };

  // Apply filters
  if (serviceId) {
    where.serviceId = serviceId;
  }
  if (staffId) {
    where.staffId = staffId;
  }
  if (rating) {
    where.rating = rating;
  }

  // Pagination
  const skip = (page - 1) * limit;
  const take = limit;

  const [reviews, total] = await Promise.all([
    prisma.review.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take,
      include: {
        user: { select: { name: true } },
        staff: { include: { user: { select: { name: true } } } },
        service: { select: { nameHi: true, nameEn: true } },
      },
    }),
    prisma.review.count({ where }),
  ]);

  return {
    reviews: reviews.map(mapReviewToResponse),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

// ==================== GET REVIEW DETAIL ====================

/**
 * Get a single review detail
 * Public: only approved reviews visible
 */
export async function getReviewById(id: string): Promise<ReviewResponse> {
  const review = await prisma.review.findUnique({
    where: { id },
    include: {
      user: { select: { name: true } },
      staff: { include: { user: { select: { name: true } } } },
      service: { select: { nameHi: true, nameEn: true } },
    },
  });

  if (!review) {
    throw new ReviewNotFoundError();
  }

  return mapReviewToResponse(review);
}

// ==================== APPROVE / HIDE REVIEW ====================

/**
 * Approve or hide a review
 * Admin only
 */
export async function approveReview(
  reviewId: string,
  isApproved: boolean
): Promise<ApproveReviewResponse> {
  const review = await prisma.review.findUnique({
    where: { id: reviewId },
  });

  if (!review) {
    throw new ReviewNotFoundError();
  }

  const updated = await prisma.review.update({
    where: { id: reviewId },
    data: { isApproved },
  });

  return {
    id: updated.id,
    isApproved: updated.isApproved,
    message: isApproved
      ? "समीक्षा स्वीकृत की गई। / Review approved."
      : "समीक्षा छिपा दी गई। / Review hidden.",
  };
}

// ==================== DELETE REVIEW ====================

/**
 * Delete a review
 * Auth: user who owns the review OR admin
 */
export async function deleteReview(
  reviewId: string,
  userId: string,
  userRole: string
): Promise<DeleteReviewResponse> {
  const review = await prisma.review.findUnique({
    where: { id: reviewId },
    select: { id: true, userId: true },
  });

  if (!review) {
    throw new ReviewNotFoundError();
  }

  // Authorization: own review or admin
  if (userRole !== "ADMIN" && review.userId !== userId) {
    throw new ReviewUnauthorizedError();
  }

  await prisma.review.delete({
    where: { id: reviewId },
  });

  return {
    id: reviewId,
    deleted: true,
  };
}
