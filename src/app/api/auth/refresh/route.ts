/**
 * Purpose: Refresh JWT token API endpoint for Nikharta Roop auth
 * Responsibility: Issue new access token using refresh token (without re-login)
 *
 * Endpoint: POST /api/auth/refresh
 *
 * OpenAPI Summary: Refresh JWT tokens
 * OpenAPI Description: Exchange a valid refresh token for new access + refresh tokens.
 *   Session rotation: old session is deleted and a new one is created.
 *   If user is suspended, all sessions are invalidated.
 *
 * Request Body:
 *   refreshToken: string — optional (fallback: read from HttpOnly cookie)
 *
 * Responses:
 *   200: { success: true, data: { tokens }, message }
 *   400: { success: false, error: "VAL_INVALID_INPUT", message, statusCode: 400 }
 *   401: { success: false, error: "AUTH_INVALID_TOKEN"|"AUTH_SESSION_INVALID"|"AUTH_ACCOUNT_SUSPENDED", message, statusCode: 401 }
 */

import { createApiHandler } from "@/lib/api-handler";
import { prisma } from "@/lib/prisma";
import { verifyRefreshToken, generateTokenPair } from "@/lib/jwt";
import { hashTokenSha256 } from "@/lib/crypto";
import { logAuthEvent, extractClientIp, extractUserAgent } from "@/lib/auth-helpers";
import { refreshTokenSchema } from "@/lib/validations/auth";
import { HTTP_MESSAGES } from "@/lib/http";
import { getRefreshTokenFromCookie, setRefreshTokenCookie } from "@/lib/server/cookies";
import {
  AuthInvalidTokenError,
  AuthSessionInvalidError,
  AuthAccountSuspendedError,
} from "@/lib/errors";
import { NextResponse } from "next/server";

export const POST = createApiHandler({
  schema: refreshTokenSchema,
  successMessage: HTTP_MESSAGES.AUTH_TOKEN_REFRESHED.messageEn,
  handler: async ({ parsedBody, request }) => {
    // Read refresh token from body OR HttpOnly cookie (cookie takes precedence for security)
    let refreshToken = parsedBody.refreshToken;

    if (!refreshToken) {
      // Fallback: read from HttpOnly cookie (browser auto-includes it)
      refreshToken = getRefreshTokenFromCookie(request) ?? "";
    }

    if (!refreshToken) {
      throw new AuthInvalidTokenError();
    }

    // 1. Verify refresh token
    const payload = await verifyRefreshToken(refreshToken);
    if (!payload) {
      throw new AuthInvalidTokenError();
    }

    // 2. Verify session still exists
    const session = await prisma.authSession.findUnique({
      where: { id: payload.sessionId },
    });

    if (!session) {
      throw new AuthSessionInvalidError();
    }

    // 3. Verify user still exists and is active
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
    });

    if (!user || !user.isActive) {
      // Delete all sessions — force re-login
      await prisma.authSession.deleteMany({
        where: { userId: payload.userId },
      });
      throw new AuthAccountSuspendedError();
    }

    // 4. Delete old session (session rotation)
    await prisma.authSession.delete({
      where: { id: payload.sessionId },
    });

    // 5. Create new session and tokens
    const newSession = await prisma.authSession.create({
      data: {
        userId: user.id,
        token: "placeholder",
        device: session.device,
        ip: extractClientIp(request),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    const tokens = await generateTokenPair({
      userId: user.id,
      mobile: user.mobile,
      role: user.role,
      sessionId: newSession.id,
    });

    // Update session with token hash (using centralized crypto utility)
    const tokenHash = await hashTokenSha256(tokens.accessToken);
    await prisma.authSession.update({
      where: { id: newSession.id },
      data: { token: tokenHash },
    });

    // 6. Log token refresh event (using centralized logAuthEvent)
    await logAuthEvent(
      user.mobile,
      "TOKEN_REFRESHED",
      request,
      {
        oldSessionId: payload.sessionId,
        newSessionId: newSession.id,
      },
      user.id
    );

    return {
      tokens: {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      },
    };
  },
  // Custom response builder: set new refresh token as HttpOnly cookie on rotation
  responseBuilder: (data) => {
    const tokenData = (data as Record<string, unknown>)?.tokens as { accessToken: string; refreshToken: string } | undefined;

    const response = NextResponse.json(
      {
        success: true,
        data: {
          tokens: tokenData
            ? { accessToken: tokenData.accessToken }
            : undefined,
        },
        message: HTTP_MESSAGES.AUTH_TOKEN_REFRESHED.messageEn,
      },
      { status: 200 }
    );

    // Rotate the refresh token cookie on every refresh
    if (tokenData?.refreshToken) {
      setRefreshTokenCookie(response, tokenData.refreshToken);
    }

    return response;
  },
});
