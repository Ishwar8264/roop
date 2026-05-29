/**
 * Purpose: Common/shared API types
 * Responsibility: Standard API response wrapper types used across all endpoints
 * Important Notes:
 *   - Every API returns ApiResponse<T> for success
 *   - Every API returns ApiError for failure
 *   - PaginatedResponse used for list endpoints
 */

// ==================== API Response Types ====================

/** Standard success response wrapper */
export interface ApiResponse<T> {
  success: true;
  data: T;
  message?: string;
}

/** Standard error response wrapper */
export interface ApiError {
  success: false;
  error: string;
  message: string;
  statusCode: number;
  retryAfterSeconds?: number;
  fields?: Record<string, string[]>;
}

/** Paginated list response */
export interface PaginatedResponse<T> {
  success: true;
  data: T[];
  pagination: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
}
