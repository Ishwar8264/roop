/**
 * Purpose: Reusable auth helper functions for API routes
 * Responsibility: Centralize common auth operations used across multiple routes
 * Important Notes:
 *   - extractTokenFromHeader: Extract Bearer token from Authorization header
 *   - logAuthEvent: Create AuthEvent records for audit trail
 *   - requireAuth: Extract + verify token + return payload (or throw AppError)
 *   - Previously these were duplicated or inline in route handlers
 */

import { NextRequest } from "next/server";
import { prisma } from "./prisma";
import { verifyAccessToken } from "./jwt";
import {
  AuthMissingTokenError,
  AuthInvalidTokenError,
  AuthSessionInvalidError,
  AuthAccountSuspendedError,
} from "./errors";
import type { JwtPayload } from "@/types/auth";

// ==================== TOKEN EXTRACTION ====================

/**
 * Extract Bearer token from Authorization header
 * @returns The token string, or null if not found
 */
export function extractTokenFromHeader(request: NextRequest): string | null {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return null;
  }
  return authHeader.split(" ")[1];
}

/**
 * Extract client IP from request headers
 * Checks x-forwarded-for (proxy) then falls back to x-real-ip
 */
export function extractClientIp(request: NextRequest): string | null {
  return request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || null;
}

/**
 * Extract user-agent from request headers
 */
export function extractUserAgent(request: NextRequest): string | null {
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
  await prisma.authEvent.create({
    data: {
      userId: userId || null,
      mobile: mobile || null,
      event,
      ip: extractClientIp(request),
      device: extractUserAgent(request),
      metadata: metadata || undefined,
    },
  });
}

// ==================== AUTH VERIFICATION (REQUIRE AUTH) ====================

/**
 * Require authenticated user — extract token, verify, check session + user active
 * Throws AppError subclasses if anything fails
 * @returns Verified JWT payload
 *
 * Usage in API routes:
 *   const payload = await requireAuth(request);
 *   // payload.userId, payload.role, payload.sessionId
 */
export async function requireAuth(request: NextRequest): Promise<JwtPayload> {
  // 1. Extract token
  const token = extractTokenFromHeader(request);
  if (!token) {
    throw new AuthMissingTokenError();
  }

  // 2. Verify JWT signature + expiry
  const payload = await verifyAccessToken(token);
  if (!payload) {
    throw new AuthInvalidTokenError();
  }

  return payload as JwtPayload;
}

/**
 * Require authenticated user + verify session still exists in DB
 * Use this for routes where session invalidation matters (logout, me, etc.)
 * @returns Verified JWT payload
 */
export async function requireAuthWithSession(request: NextRequest): Promise<{
  payload: JwtPayload;
  session: { id: string; userId: string; token: string; expiresAt: Date };
}> {
  const payload = await requireAuth(request);

  // Verify session exists in DB
  const session = await prisma.authSession.findUnique({
    where: { id: payload.sessionId },
  });

  if (!session) {
    throw new AuthSessionInvalidError();
  }

  return { payload, session };
}

/**
 * Require authenticated user + verify user is still active
 * Use this for routes that return user data (me, profile, etc.)
 * @returns Verified JWT payload + user record
 */
export async function requireActiveUser(request: NextRequest): Promise<{
  payload: JwtPayload;
  user: {
    id: string;
    mobile: string;
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
