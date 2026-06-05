/**
 * Purpose: Refresh JWT token API endpoint for Nikharta Roop auth
 * Responsibility: Rotate HttpOnly auth cookies using refresh token (without re-login)
 *
 * Endpoint: POST /api/auth/refresh
 *
 * Flow:
 *   1. Read refresh token from HttpOnly cookie
 *   2. Verify refresh token JWT
 *   3. Verify session exists in DB
 *   4. Verify user is still active
 *   5. Delete old session (session rotation)
 *   6. Create new session with device info from old session
 *   7. Generate new token pair
 *   8. Set new refresh token cookie
 *   9. Log token refresh event
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/database/prisma";
import { verifyRefreshToken, generateTokenPair } from "@/lib/server/jwt";
import { hashTokenSha256, generateTokenFamily } from "@/lib/server/crypto";
import { logAuthEvent } from "@/lib/auth-helpers";
import { getRefreshTokenFromCookie, setRefreshTokenCookie, setAccessTokenCookie } from "@/lib/server/cookies";
import { SESSION_CONFIG, REDIS_KEYS } from "@/lib/config/auth";
import { redis } from "@/lib/config/redis";
import {
  AuthInvalidTokenError,
  AuthSessionInvalidError,
  AuthAccountSuspendedError,
  isAppError,
  toAppError,
} from "@/lib/server/errors";
import type { UserRole } from "@/shared/types/enums";

export async function POST(request: NextRequest) {
  try {
    // 1. Read refresh token from HttpOnly cookie
    const refreshToken = getRefreshTokenFromCookie(request);
    if (!refreshToken) {
      throw new AuthInvalidTokenError();
    }

    // 2. Verify refresh token JWT
    const payload = await verifyRefreshToken(refreshToken);
    if (!payload) {
      throw new AuthInvalidTokenError();
    }

    // 3. Verify session exists
    const session = await prisma.session.findUnique({
      where: { id: payload.sessionId },
    });

    if (!session) {
      throw new AuthSessionInvalidError();
    }

    // 4. Verify refresh token hash matches (reuse detection)
    const currentHash = await hashTokenSha256(refreshToken);
    if (session.refreshTokenHash !== currentHash) {
      // Token reuse detected — revoke all sessions
      await prisma.session.deleteMany({ where: { userId: payload.userId } });
      throw new AuthSessionInvalidError();
    }

    // 5. Verify user is still active
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, isActive: true, role: true },
    });

    if (!user || !user.isActive) {
      await prisma.session.deleteMany({ where: { userId: payload.userId } });
      throw new AuthAccountSuspendedError();
    }

    // 6. Delete old session (rotation)
    await prisma.session.delete({ where: { id: session.id } });

    // 7. Create new session (with device info from old session)
    const family = generateTokenFamily();
    const newSession = await prisma.session.create({
      data: {
        userId: user.id,
        refreshTokenHash: "placeholder",
        deviceName: session.deviceName,
        deviceType: session.deviceType,
        browser: session.browser,
        os: session.os,
        ip: session.ip,
        country: session.country,
        city: session.city,
        userAgent: session.userAgent,
        lastActiveAt: new Date(),
        expiresAt: new Date(
          Date.now() + SESSION_CONFIG.REFRESH_TOKEN_DAYS * 24 * 60 * 60 * 1000
        ),
      },
    });

    // 8. Generate new token pair
    const tokens = await generateTokenPair(
      {
        userId: user.id,
        role: user.role as UserRole,
        sessionId: newSession.id,
      },
      family
    );

    // 9. Update session with refresh token hash
    const refreshTokenHash = await hashTokenSha256(tokens.refreshToken);
    await prisma.session.update({
      where: { id: newSession.id },
      data: { refreshTokenHash },
    });

    // 10. Store token family in Redis for reuse detection
    await redis.set(
      `${REDIS_KEYS.REFRESH_FAMILY_PREFIX}${newSession.id}`,
      JSON.stringify({ family, tokens: [refreshTokenHash] }),
      "EX",
      SESSION_CONFIG.REFRESH_TOKEN_DAYS * 24 * 60 * 60
    );

    // 11. Log token refresh event
    await logAuthEvent(null, "TOKEN_REFRESHED", request, {
      oldSessionId: payload.sessionId,
      newSessionId: newSession.id,
    }, user.id);

    // 12. Build response with new cookies
    const response = NextResponse.json(
      {
        success: true,
        data: {},
        message: "Token refreshed successfully.",
      },
      { status: 200 }
    );

    setRefreshTokenCookie(response, tokens.refreshToken);
    setAccessTokenCookie(response, tokens.accessToken);

    return response;
  } catch (error: unknown) {
    if (isAppError(error)) {
      return NextResponse.json(
        { success: false, error: error.code, message: error.message, statusCode: error.statusCode },
        { status: error.statusCode }
      );
    }

    const appError = toAppError(error);
    console.error("[UNHANDLED_ERROR_REFRESH]", error);
    return NextResponse.json(
      { success: false, error: appError.code, message: appError.message, statusCode: appError.statusCode },
      { status: appError.statusCode }
    );
  }
}
