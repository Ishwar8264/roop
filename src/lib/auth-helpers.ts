/**
 * Purpose: Reusable auth helper functions for API routes
 * Responsibility: Centralize common auth operations used across multiple routes
 * Important Notes:
 *   - extractAccessToken: Extract token from Authorization header or HttpOnly access cookie
 *   - logAuthEvent: Create AuthEvent records for audit trail
 *   - requireAuth: Extract + verify token + return payload (or throw AppError)
 *   - Previously these were duplicated or inline in route handlers
 */

import { NextRequest } from "next/server";
import { prisma } from "./prisma";
import { verifyAccessToken } from "@/lib/server/jwt";
import { getAccessTokenFromCookie } from "@/lib/server/cookies";
import {
  AuthMissingTokenError,
  AuthInvalidTokenError,
  AuthSessionInvalidError,
  AuthAccountSuspendedError,
} from "@/lib/server/errors";
import { extractClientIp as extractClientIpUtil, extractGeoFromIp } from "@/lib/server/device";
import type { AccessTokenPayload } from "@/shared/types/auth";

// ==================== TOKEN EXTRACTION ====================

/**
 * Extract access token from Authorization header or HttpOnly cookie
 * @returns The token string, or null if not found
 */
function extractAccessToken(request: NextRequest): string | null {
  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.split(" ")[1];
  }

  return getAccessTokenFromCookie(request);
}

/**
 * Extract Bearer token from Authorization header
 * Kept for backward compatibility with non-browser API clients
 */
function _extractTokenFromHeader(request: NextRequest): string | null {
  const authHeader = request.headers.get("authorization");
  return authHeader?.startsWith("Bearer ") ? authHeader.split(" ")[1] : null;
}

/**
 * Extract client IP from request headers
 * Checks x-forwarded-for (proxy) then falls back to x-real-ip
 */
function extractClientIp(request: NextRequest): string | null {
  return extractClientIpUtil(request);
}

/**
 * Extract user-agent from request headers
 */
function _extractUserAgent(request: NextRequest): string | null {
  return request.headers.get("user-agent") || null;
}

// ==================== AUTH EVENT LOGGING ====================

/**
 * Log an auth event for audit trail
 * Used in: send-otp, verify-otp, logout, refresh, register-email, login-email, google routes
 */
export async function logAuthEvent(
  mobile: string | null,
  event: "LOGIN_SUCCESS" | "LOGIN_FAILED" | "OTP_SENT" | "OTP_VERIFIED" | "LOGOUT" | "TOKEN_REFRESHED" | "REGISTER_EMAIL" | "REGISTER_GOOGLE" | "LOGIN_EMAIL" | "LOGIN_GOOGLE",
  request: NextRequest,
  metadata?: Record<string, unknown>,
  userId?: string
): Promise<void> {
  try {
    const ip = extractClientIp(request);
    const geo = extractGeoFromIp(ip);
    const ua = request.headers.get("user-agent") || null;

    await prisma.authEvent.create({
      data: {
        userId: userId || null,
        identifier: mobile || null,
        mobile: mobile || null,
        event,
        ip,
        device: ua, // legacy compat
        userAgent: ua,
        country: geo.country,
        metadata: metadata ? JSON.stringify(metadata) : undefined,
      },
    });
  } catch (error) {
    // Audit logging should NEVER break the auth flow
    console.error("[AUTH_EVENT_LOG_FAILED]", error);
  }
}

// ==================== AUTH VERIFICATION (REQUIRE AUTH) ====================

/**
 * Require authenticated user — extract token, verify, check session + user active
 * Throws AppError subclasses if anything fails
 * @returns Verified JWT payload (AccessTokenPayload)
 *
 * Usage in API routes:
 *   const payload = await requireAuth(request);
 *   // payload.userId, payload.role, payload.sessionId
 */
export async function requireAuth(request: NextRequest): Promise<AccessTokenPayload> {
  // 1. Extract token
  const token = extractAccessToken(request);
  if (!token) {
    throw new AuthMissingTokenError();
  }

  // 2. Verify JWT signature + expiry
  const payload = await verifyAccessToken(token);
  if (!payload) {
    throw new AuthInvalidTokenError();
  }

  return payload;
}

/**
 * Require authenticated user + verify session still exists in DB + user is active
 * Use this for routes where session invalidation matters (logout, me, etc.)
 * @returns Verified JWT payload + user record
 */
async function _requireAuthWithSession(request: NextRequest): Promise<{
  payload: AccessTokenPayload;
  user: { id: string; isActive: boolean; role: string };
}> {
  const payload = await requireAuth(request);

  // Verify user exists and is active
  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: { id: true, isActive: true, role: true },
  });

  if (!user) {
    throw new AuthInvalidTokenError();
  }

  if (!user.isActive) {
    throw new AuthAccountSuspendedError();
  }

  // Verify session exists in DB
  const session = await prisma.session.findUnique({
    where: { id: payload.sessionId },
    select: { id: true },
  });

  if (!session) {
    throw new AuthSessionInvalidError();
  }

  return { payload, user };
}

/**
 * Require authenticated user + verify user is still active
 * Use this for routes that return user data (me, profile, etc.)
 * @returns Verified JWT payload + user record
 */
export async function requireActiveUser(request: NextRequest): Promise<{
  payload: AccessTokenPayload;
  user: {
    id: string;
    mobile: string | null;
    phone: string | null;
    name: string | null;
    email: string | null;
    role: string;
    branchId: string | null;
    avatarUrl: string | null;
    loyaltyPoints: number;
    isActive: boolean;
    lastLoginAt: Date | null;
    createdAt: Date;
  };
}> {
  const payload = await requireAuth(request);

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: {
      id: true,
      mobile: true,
      phone: true,
      name: true,
      email: true,
      role: true,
      branchId: true,
      avatarUrl: true,
      loyaltyPoints: true,
      isActive: true,
      lastLoginAt: true,
      createdAt: true,
    },
  });

  if (!user) {
    throw new AuthInvalidTokenError();
  }

  if (!user.isActive) {
    throw new AuthAccountSuspendedError();
  }

  return { payload, user };
}
