/**
 * Purpose: Logout API endpoint for Nikharta Roop auth
 * Responsibility: Invalidate JWT session by deleting Session record, clear auth cookies
 *
 * Endpoint: POST /api/auth/logout
 *
 * Flow:
 *   1. Extract and verify Bearer token
 *   2. Delete session record from DB
 *   3. Clean up Redis family key
 *   4. Log logout event
 *   5. Clear both auth cookies
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/database/prisma";
import { requireAuth, logAuthEvent } from "@/lib/auth-helpers";
import { clearRefreshTokenCookie, clearAccessTokenCookie } from "@/lib/server/cookies";
import { redis } from "@/lib/config/redis";
import { REDIS_KEYS } from "@/lib/config/auth";
import { isAppError, toAppError } from "@/lib/server/errors";
import { HTTP_STATUS as _HTTP_STATUS } from "@/shared/constants";

export async function POST(request: NextRequest) {
  try {
    // 1. Extract and verify token
    const payload = await requireAuth(request);

    // 2. Delete session record
    const deletedSession = await prisma.session.deleteMany({
      where: {
        id: payload.sessionId,
        userId: payload.userId,
      },
    });

    // 3. Clean up Redis family key
    await redis.del(`${REDIS_KEYS.REFRESH_FAMILY_PREFIX}${payload.sessionId}`).catch(() => {});

    // 4. Log logout event
    await logAuthEvent(null, "LOGOUT", request, {
      sessionId: payload.sessionId,
      sessionDeleted: deletedSession.count > 0,
    }, payload.userId);

    // 5. Build response and clear cookies
    const response = NextResponse.json(
      {
        success: true,
        data: { sessionId: payload.sessionId },
        message: "Logged out successfully.",
      },
      { status: 200 }
    );

    clearRefreshTokenCookie(response);
    clearAccessTokenCookie(response);

    return response;
  } catch (error: unknown) {
    if (isAppError(error)) {
      return NextResponse.json(
        { success: false, error: error.code, message: error.message, statusCode: error.statusCode },
        { status: error.statusCode }
      );
    }

    const appError = toAppError(error);
    console.error("[UNHANDLED_ERROR_LOGOUT]", error);
    return NextResponse.json(
      { success: false, error: appError.code, message: appError.message, statusCode: appError.statusCode },
      { status: appError.statusCode }
    );
  }
}
