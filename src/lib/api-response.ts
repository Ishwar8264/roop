/**
 * Purpose: Standardized API response helpers for Nikharta Roop
 * Responsibility: Consistent response format across all API routes
 * Important Notes:
 *   - Every API route MUST use these helpers — never return raw Response
 *   - Success: { success: true, data: T, message?: string }
 *   - Error: { success: false, error: string, message: string, statusCode: number }
 *   - All responses include proper HTTP status codes
 */

import { NextResponse } from "next/server";

// ==================== SUCCESS RESPONSES ====================

/**
 * 200 OK — Standard success response with data
 */
export function apiSuccess<T>(
  data: T,
  message?: string,
  status: number = 200
): NextResponse {
  return NextResponse.json(
    {
      success: true,
      data,
      ...(message && { message }),
    },
    { status }
  );
}

/**
 * 201 Created — Resource created successfully
 */
export function apiCreated<T>(
  data: T,
  message?: string
): NextResponse {
  return NextResponse.json(
    {
      success: true,
      data,
      ...(message && { message }),
    },
    { status: 201 }
  );
}

// ==================== ERROR RESPONSES ====================

/**
 * 400 Bad Request — Validation error, malformed input
 */
export function apiBadRequest(
  message: string,
  error?: string
): NextResponse {
  return NextResponse.json(
    {
      success: false,
      error: error || "BAD_REQUEST",
      message,
      statusCode: 400,
    },
    { status: 400 }
  );
}

/**
 * 401 Unauthorized — Missing or invalid token
 */
export function apiUnauthorized(
  message: string = "Authentication required"
): NextResponse {
  return NextResponse.json(
    {
      success: false,
      error: "UNAUTHORIZED",
      message,
      statusCode: 401,
    },
    { status: 401 }
  );
}

/**
 * 403 Forbidden — Authenticated but not authorized (wrong role)
 */
export function apiForbidden(
  message: string = "You do not have permission to access this resource"
): NextResponse {
  return NextResponse.json(
    {
      success: false,
      error: "FORBIDDEN",
      message,
      statusCode: 403,
    },
    { status: 403 }
  );
}

/**
 * 404 Not Found — Resource not found
 */
export function apiNotFound(
  message: string = "Resource not found"
): NextResponse {
  return NextResponse.json(
    {
      success: false,
      error: "NOT_FOUND",
      message,
      statusCode: 404,
    },
    { status: 404 }
  );
}

/**
 * 409 Conflict — Duplicate resource, conflict
 */
export function apiConflict(
  message: string,
  error?: string
): NextResponse {
  return NextResponse.json(
    {
      success: false,
      error: error || "CONFLICT",
      message,
      statusCode: 409,
    },
    { status: 409 }
  );
}

/**
 * 422 Unprocessable Entity — Business logic validation failed
 */
export function apiValidationError(
  message: string,
  errors?: Record<string, string[]>
): NextResponse {
  return NextResponse.json(
    {
      success: false,
      error: "VALIDATION_ERROR",
      message,
      statusCode: 422,
      ...(errors && { errors }),
    },
    { status: 422 }
  );
}

/**
 * 429 Too Many Requests — Rate limited
 */
export function apiRateLimited(
  message: string,
  retryAfterSeconds?: number
): NextResponse {
  return NextResponse.json(
    {
      success: false,
      error: "RATE_LIMITED",
      message,
      statusCode: 429,
      ...(retryAfterSeconds && { retryAfterSeconds }),
    },
    {
      status: 429,
      headers: retryAfterSeconds
        ? { "Retry-After": retryAfterSeconds.toString() }
        : undefined,
    }
  );
}

/**
 * 500 Internal Server Error — Unexpected error
 */
export function apiServerError(
  message: string = "An unexpected error occurred"
): NextResponse {
  return NextResponse.json(
    {
      success: false,
      error: "INTERNAL_ERROR",
      message,
      statusCode: 500,
    },
    { status: 500 }
  );
}
