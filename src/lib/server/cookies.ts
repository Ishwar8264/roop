/**
 * Purpose: Cookie management for auth tokens
 * Responsibility: Set/clear refresh + access token cookies in HttpOnly cookies
 * Important Notes:
 *   - Refresh token goes in HttpOnly + Secure + SameSite=Lax cookie (30 days)
 *   - Access token goes in HttpOnly + Secure + SameSite=Lax cookie (15 min)
 *     — serves as backup for page route auth when refresh cookie isn't picked up
 *   - Access token is ALSO returned in JSON body — stored in memory by frontend
 *   - This pattern prevents XSS from stealing tokens
 *   - SameSite=Lax blocks CSRF on sub-requests while allowing top-level navigation
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

// ==================== SET ACCESS TOKEN COOKIE ====================

/**
 * Set access token as short-lived HttpOnly cookie on the response
 * This is a FALLBACK for page route authentication in proxy.ts.
 * Some browsers don't reliably store cookies set via fetch() Set-Cookie
 * headers. By also setting the access token as a cookie, proxy.ts can
 * verify page-level auth even if the refresh token cookie isn't stored.
 *
 * The access token cookie is short-lived (15 min) and HttpOnly — same
 * security profile as the in-memory access token, just in cookie form.
 */
export function setAccessTokenCookie(
  response: NextResponse,
  accessToken: string
): void {
  response.cookies.set({
    name: SESSION_CONFIG.ACCESS_TOKEN_COOKIE,
    value: accessToken,
    httpOnly: SESSION_CONFIG.COOKIE_HTTP_ONLY,
    secure: SESSION_CONFIG.COOKIE_SECURE,
    sameSite: SESSION_CONFIG.COOKIE_SAME_SITE,
    path: SESSION_CONFIG.COOKIE_PATH,
    maxAge: SESSION_CONFIG.ACCESS_TOKEN_COOKIE_MAX_AGE, // 15 minutes
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

// ==================== GET ACCESS TOKEN FROM COOKIE ====================

/**
 * Extract access token from the HttpOnly request cookie
 * Used by server-side auth guards for browser requests
 */
export function getAccessTokenFromCookie(
  request: NextRequest
): string | null {
  return request.cookies.get(SESSION_CONFIG.ACCESS_TOKEN_COOKIE)?.value ?? null;
}

// ==================== CLEAR AUTH COOKIES ====================

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

/**
 * Clear the access token cookie — used on logout
 */
export function clearAccessTokenCookie(response: NextResponse): void {
  response.cookies.set({
    name: SESSION_CONFIG.ACCESS_TOKEN_COOKIE,
    value: "",
    httpOnly: SESSION_CONFIG.COOKIE_HTTP_ONLY,
    secure: SESSION_CONFIG.COOKIE_SECURE,
    sameSite: SESSION_CONFIG.COOKIE_SAME_SITE,
    path: SESSION_CONFIG.COOKIE_PATH,
    maxAge: 0,
  });
}
