/**
 * Purpose: Cookie management for auth tokens
 * Responsibility: Set/clear refresh token in HttpOnly cookies
 * Important Notes:
 *   - Refresh token goes in HttpOnly + Secure + SameSite=Strict cookie
 *   - Access token is returned in JSON body — stored in memory by frontend
 *   - This pattern prevents XSS from stealing refresh tokens
 *   - CSRF-safe because SameSite=Strict
 */

import { NextRequest, NextResponse } from "next/server";
import { SESSION_CONFIG } from "@/lib/config/auth";

// ==================== SET REFRESH TOKEN COOKIE ====================

/**
 * Set refresh token as HttpOnly cookie on the response
 * Called after successful login/register/refresh
 */
export function setRefreshTokenCookie(
  response: NextResponse,
  refreshToken: string
): void {
  response.cookies.set({
    name: SESSION_CONFIG.REFRESH_TOKEN_COOKIE,
    value: refreshToken,
    httpOnly: SESSION_CONFIG.COOKIE_HTTP_ONLY,
    secure: SESSION_CONFIG.COOKIE_SECURE,
    sameSite: SESSION_CONFIG.COOKIE_SAME_SITE,
    path: SESSION_CONFIG.COOKIE_PATH,
    maxAge: SESSION_CONFIG.REFRESH_TOKEN_DAYS * 24 * 60 * 60, // 30 days in seconds
  });
}

// ==================== GET REFRESH TOKEN FROM COOKIE ====================

/**
 * Extract refresh token from request cookies
 * Used in /api/auth/refresh endpoint
 */
export function getRefreshTokenFromCookie(
  request: NextRequest
): string | null {
  return request.cookies.get(SESSION_CONFIG.REFRESH_TOKEN_COOKIE)?.value ?? null;
}

// ==================== CLEAR REFRESH TOKEN COOKIE ====================

/**
 * Clear the refresh token cookie — used on logout
 */
export function clearRefreshTokenCookie(response: NextResponse): void {
  response.cookies.set({
    name: SESSION_CONFIG.REFRESH_TOKEN_COOKIE,
    value: "",
    httpOnly: SESSION_CONFIG.COOKIE_HTTP_ONLY,
    secure: SESSION_CONFIG.COOKIE_SECURE,
    sameSite: SESSION_CONFIG.COOKIE_SAME_SITE,
    path: SESSION_CONFIG.COOKIE_PATH,
    maxAge: 0, // Expire immediately
  });
}
