/**
 * Purpose: Session management service — create, verify, rotate, revoke
 * Responsibility: All session CRUD operations + refresh token rotation with reuse detection
 * Important Notes:
 *   - Sessions stored in PostgreSQL (durable, queryable)
 *   - Refresh token FAMILIES tracked in Redis (for reuse detection)
 *   - Refresh token rotation: old session deleted, new session created
 *   - Reuse detection: if a previously-used refresh token is used again,
 *     ALL sessions in that family are invalidated (security best practice)
 *   - Device tracking on every session
 *   - Max concurrent sessions enforced
 */

import { prisma } from "@/lib/database/prisma";
import { redis } from "@/lib/config/redis";
import { SESSION_CONFIG, RATE_LIMIT_CONFIG, REDIS_KEYS } from "@/lib/config/auth";
import { generateTokenPair, verifyRefreshToken, signAccessToken, verifyAccessToken } from "@/lib/server/jwt";
import { hashTokenSha256, generateTokenFamily } from "@/lib/server/crypto";
import { parseUserAgent, extractClientIp, extractGeoFromIp } from "@/lib/server/device";
import { setRefreshTokenCookie, clearRefreshTokenCookie, getRefreshTokenFromCookie } from "@/lib/server/cookies";
import {
  AuthSessionInvalidError,
  AuthSessionRevokedError,
  AuthAccountSuspendedError,
  AuthRefreshReuseError,
} from "@/lib/server/errors";
import type { AccessTokenPayload } from "@/shared/types/auth";
import type { NextRequest, NextResponse } from "next/server";
import type { UserRole } from "@/shared/types/enums";

// ==================== CREATE SESSION ====================

/**
 * Create a new auth session with device tracking
 * Called after successful login/register/Google auth
 *
 * @returns Access token + refresh token + session ID
 */
export async function createSession(
  userId: string,
  role: UserRole,
  request: NextRequest
): Promise<{
  accessToken: string;
  refreshToken: string;
  sessionId: string;
}> {
  // 1. Parse device info
  const ua = request.headers.get("user-agent") || "";
  const device = parseUserAgent(ua);
  const ip = extractClientIp(request);
  const geo = extractGeoFromIp(ip);

  // 2. Enforce max concurrent sessions
  const activeSessions = await prisma.session.findMany({
    where: { userId, expiresAt: { gt: new Date() } },
    orderBy: { lastActiveAt: "asc" },
  });

  if (activeSessions.length >= RATE_LIMIT_CONFIG.MAX_SESSIONS_PER_USER) {
    // Revoke oldest session to make room
    const oldest = activeSessions[0];
    await prisma.session.delete({ where: { id: oldest.id } });
    // Also clean up Redis family
    await redis.del(`${REDIS_KEYS.REFRESH_FAMILY_PREFIX}${oldest.id}`);
  }

  // 3. Generate token family (for reuse detection)
  const family = generateTokenFamily();

  // 4. Create placeholder session first (need ID for JWT)
  const session = await prisma.session.create({
    data: {
      userId,
      refreshTokenHash: "placeholder",
      deviceName: device.deviceName,
      deviceType: device.deviceType,
      browser: device.browser,
      os: device.os,
      ip,
      country: geo.country,
      city: geo.city,
      userAgent: ua,
      lastActiveAt: new Date(),
      expiresAt: new Date(
        Date.now() + SESSION_CONFIG.REFRESH_TOKEN_DAYS * 24 * 60 * 60 * 1000
      ),
    },
  });

  // 5. Generate token pair
  const accessPayload: AccessTokenPayload = {
    userId,
    role,
    sessionId: session.id,
  };

  const { accessToken, refreshToken } = await generateTokenPair(
    accessPayload,
    family
  );

  // 6. Update session with refresh token hash
  const refreshTokenHash = await hashTokenSha256(refreshToken);
  await prisma.session.update({
    where: { id: session.id },
    data: { refreshTokenHash },
  });

  // 7. Store token family in Redis for reuse detection
  await redis.set(
    `${REDIS_KEYS.REFRESH_FAMILY_PREFIX}${session.id}`,
    JSON.stringify({ family, tokens: [refreshTokenHash] }),
    "EX",
    SESSION_CONFIG.REFRESH_TOKEN_DAYS * 24 * 60 * 60
  );

  // 8. Update user's lastLoginAt
  await prisma.user.update({
    where: { id: userId },
    data: { lastLoginAt: new Date() },
  });

  return { accessToken, refreshToken, sessionId: session.id };
}

// ==================== REFRESH SESSION (TOKEN ROTATION) ====================

/**
 * Refresh an expired access token using the refresh token
 * Implements token rotation + reuse detection
 *
 * Returns new token pair — the route handler is responsible for setting cookies
 */
export async function refreshSession(
  request: NextRequest
): Promise<{
  accessToken: string;
  refreshToken: string;
  sessionId: string;
}> {
  // 1. Get refresh token from HttpOnly cookie
  const refreshToken = getRefreshTokenFromCookie(request);
  if (!refreshToken) {
    throw new AuthSessionInvalidError();
  }

  // 2. Verify refresh token JWT
  const payload = await verifyRefreshToken(refreshToken);
  if (!payload) {
    throw new AuthSessionInvalidError();
  }

  // 3. Check session exists in DB
  const session = await prisma.session.findUnique({
    where: { id: payload.sessionId },
  });

  if (!session) {
    // Session was already deleted — possible reuse attempt!
    await handleReuseDetection(payload.family, payload.userId);
    throw new AuthRefreshReuseError();
  }

  // 4. Verify the refresh token hash matches
  const currentHash = await hashTokenSha256(refreshToken);
  if (session.refreshTokenHash !== currentHash) {
    // Token hash doesn't match — reuse detected!
    await handleReuseDetection(payload.family, payload.userId);
    throw new AuthRefreshReuseError();
  }

  // 5. Check user is still active
  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: { id: true, isActive: true, role: true },
  });

  if (!user || !user.isActive) {
    await revokeAllUserSessions(payload.userId);
    throw new AuthAccountSuspendedError();
  }

  // 6. Delete old session
  await prisma.session.delete({ where: { id: session.id } });

  // 7. Create new session (rotation)
  const result = await createSession(user.id, user.role as UserRole, request);

  return result;
}

// ==================== REUSE DETECTION ====================

/**
 * Handle refresh token reuse — revoke ALL sessions in the family
 * This is the CRITICAL security feature:
 * If someone steals a refresh token and uses it AFTER the legitimate user
 * already refreshed it, we detect the reuse and invalidate everything.
 */
async function handleReuseDetection(
  family: string,
  userId: string
): Promise<void> {
  console.warn(
    `[SECURITY] Refresh token reuse detected! Family: ${family}, User: ${userId}. Revoking all sessions.`
  );

  // Revoke all user sessions — force re-login on all devices
  await revokeAllUserSessions(userId);

  // TODO: Send security alert email/notification to user
  // TODO: Log to security monitoring system
}

// ==================== REVOKE SESSION ====================

/**
 * Revoke a specific session (logout from one device)
 */
export async function revokeSession(
  sessionId: string,
  userId: string
): Promise<void> {
  await prisma.session.deleteMany({
    where: { id: sessionId, userId },
  });
  await redis.del(`${REDIS_KEYS.REFRESH_FAMILY_PREFIX}${sessionId}`);
}

/**
 * Revoke all sessions for a user (logout from all devices)
 */
export async function revokeAllUserSessions(userId: string): Promise<void> {
  const sessions = await prisma.session.findMany({
    where: { userId },
    select: { id: true },
  });

  await prisma.session.deleteMany({ where: { userId } });

  // Clean up Redis families
  if (sessions.length > 0) {
    const keys = sessions.map(
      (s) => `${REDIS_KEYS.REFRESH_FAMILY_PREFIX}${s.id}`
    );
    await redis.del(...keys);
  }
}

// ==================== LIST SESSIONS ====================

/**
 * List all active sessions for a user (for device management UI)
 */
export async function listUserSessions(
  userId: string,
  currentSessionId: string
) {
  const sessions = await prisma.session.findMany({
    where: { userId, expiresAt: { gt: new Date() } },
    orderBy: { lastActiveAt: "desc" },
  });

  return sessions.map((s) => ({
    id: s.id,
    deviceName: s.deviceName,
    deviceType: s.deviceType,
    browser: s.browser,
    os: s.os,
    ip: s.ip,
    country: s.country,
    city: s.city,
    lastActiveAt: s.lastActiveAt.toISOString(),
    createdAt: s.createdAt.toISOString(),
    isCurrent: s.id === currentSessionId,
  }));
}

// ==================== UPDATE LAST ACTIVE ====================

/**
 * Update lastActiveAt timestamp for a session
 * Called on each authenticated API request
 */
export async function touchSession(sessionId: string): Promise<void> {
  await prisma.session.update({
    where: { id: sessionId },
    data: { lastActiveAt: new Date() },
  }).catch(() => {
    // Session might have been deleted — ignore error
  });
}

/**
 * Throttled version of touchSession — updates lastActiveAt at most once per 5 minutes
 * Prevents excessive DB writes on every /me request
 */
const TOUCH_THROTTLE_SECONDS = 300; // 5 minutes

export async function touchSessionThrottled(sessionId: string): Promise<void> {
  const key = `session:touch:${sessionId}`;
  const exists = await redis.exists(key);
  if (exists) return; // Throttled — skip update

  await prisma.session.update({
    where: { id: sessionId },
    data: { lastActiveAt: new Date() },
  }).catch(() => {});

  // Set throttle key with 5-minute TTL
  await redis.setex(key, TOUCH_THROTTLE_SECONDS, "1");
}

// ==================== REQUIRE AUTH ====================

/**
 * Require authenticated user — extract token, verify, check session
 * Use this in API routes that need authentication
 */
export async function requireAuth(request: NextRequest): Promise<AccessTokenPayload> {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    throw new AuthSessionInvalidError();
  }

  const token = authHeader.split(" ")[1];
  const payload = await verifyAccessToken(token);
  if (!payload) {
    throw new AuthSessionInvalidError();
  }

  return payload;
}

/**
 * Require authenticated user + verify session exists in DB + user is active
 * Use this for sensitive operations
 */
export async function requireAuthWithSession(request: NextRequest): Promise<{
  payload: AccessTokenPayload;
  user: { id: string; isActive: boolean; role: string };
}> {
  const payload = await requireAuth(request);

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: { id: true, isActive: true, role: true },
  });

  if (!user) {
    throw new AuthSessionInvalidError();
  }

  if (!user.isActive) {
    throw new AuthAccountSuspendedError();
  }

  // Verify session exists
  const session = await prisma.session.findUnique({
    where: { id: payload.sessionId },
    select: { id: true },
  });

  if (!session) {
    throw new AuthSessionRevokedError();
  }

  return { payload, user };
}

// ==================== HELPER: BUILD AUTH RESPONSE ====================

/**
 * Get user profile with providers for auth response
 */
export async function getUserWithProviders(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true, name: true, email: true, phone: true, avatarUrl: true,
      emailVerified: true, phoneVerified: true, role: true, branchId: true, loyaltyPoints: true,
      accounts: { select: { provider: true } },
    },
  });

  if (!user) return null;

  return {
    ...user,
    providers: user.accounts.map((a) => a.provider),
  };
}
