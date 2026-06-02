/**
 * Purpose: Review feature types — shared across service, routes, and client
 * Responsibility: Type definitions for review CRUD and moderation APIs
 * Important Notes:
 *   - These are API response types — never expose raw Prisma models
 *   - One review per booking (bookingId is unique on Review)
 *   - Review auto-fills staffId and serviceId from booking (don't trust frontend)
 *   - isApproved defaults to true; admin can hide inappropriate reviews
 *   - Date fields returned as ISO strings for frontend convenience
 */

// ==================== REVIEW RESPONSE ====================

/** Review response — used in list and detail */
export interface ReviewResponse {
  id: string;
  userId: string;
  userName: string | null;
  bookingId: string;
  staffId: string | null;
  staffName: string | null;
  serviceId: string;
  serviceNameHi: string;
  serviceNameEn: string;
  rating: number;
  commentHi: string | null;
  commentEn: string | null;
  isApproved: boolean;
  createdAt: string;
  updatedAt: string;
}

/** Paginated review list response */
export interface ReviewListResponse {
  reviews: ReviewResponse[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ==================== SUBMIT REVIEW ====================

/** Response for POST /api/reviews */
export interface SubmitReviewResponse {
  id: string;
  bookingId: string;
  rating: number;
  isApproved: boolean;
  createdAt: string;
}

// ==================== APPROVE REVIEW ====================

/** Response for PATCH /api/reviews/[id]/approve */
export interface ApproveReviewResponse {
  id: string;
  isApproved: boolean;
  message: string;
}

// ==================== DELETE REVIEW ====================

/** Response for DELETE /api/reviews/[id] */
export interface DeleteReviewResponse {
  id: string;
  deleted: boolean;
}

// ==================== QUERY / FILTER TYPES ====================

/** Query params for GET /api/reviews */
export interface ReviewListQuery {
  serviceId?: string;
  staffId?: string;
  rating?: number;
  page?: number;
  limit?: number;
}
