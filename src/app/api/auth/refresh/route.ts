/**
 * Purpose: Refresh JWT token API endpoint for Nikharta Roop auth
 * Responsibility: Issue new access token using refresh token (without re-login)
 * Important Notes:
 *   - POST /api/auth/refresh
 *   - Session rotation: old session deleted, new session created
 *   - Uses createApiHandler for standardized handling
 */

import { createApiHandler } from "@/lib/api-handler";
import { prisma } from "@/lib/prisma";
import { verifyRefreshToken, generateTokenPair } from "@/lib/jwt";
import { refreshTokenSchema } from "@/lib/validations/auth";
import { HTTP_MESSAGES } from "@/lib/http";
import {
  AuthInvalidTokenError,
  AuthSessionInvalidError,
  AuthAccountSuspendedError,
} from "@/lib/errors";

export const POST = createApiHandler({
  schema: refreshTokenSchema,
  successMessage: HTTP_MESSAGES.AUTH_TOKEN_REFRESHED.messageEn,
  handler: async ({ parsedBody, request }) => {
    const { refreshToken } = parsedBody;

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
        ip: request.headers.get("x-forwarded-for") || null,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    const tokens = await generateTokenPair({
      userId: user.id,
      mobile: user.mobile,
      role: user.role,
      sessionId: newSession.id,
    });

    // Update session with token hash
    const tokenHash = await hashTokenSha256(tokens.accessToken);
    await prisma.authSession.update({
      where: { id: newSession.id },
      data: { token: tokenHash },
    });

    // 6. Log token refresh event
    await prisma.authEvent.create({
      data: {
        userId: user.id,
        mobile: user.mobile,
        event: "TOKEN_REFRESHED",
        ip: request.headers.get("x-forwarded-for") || null,
        device: request.headers.get("user-agent") || null,
        metadata: {
          oldSessionId: payload.sessionId,
          newSessionId: newSession.id,
        },
      },
    });

    return {
      tokens: {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      },
    };
  },
});

async function hashTokenSha256(token: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(token);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}
