/**
 * Purpose: Refresh JWT token API endpoint for Nikharta Roop auth
 * Responsibility: Issue new access token using refresh token (without re-login)
 * Important Notes:
 *   - POST /api/auth/refresh
 *   - Body: { refreshToken: "eyJhbGciOi..." }
 *   - Verifies refresh token is valid and session still exists
 *   - Issues new access token (15 min) + new refresh token (7 days)
 *   - Old session is deleted and new session is created (session rotation)
 *   - Logs AuthEvent for audit trail
 *   - If refresh token is invalid → 401 (force re-login)
 */

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyRefreshToken, generateTokenPair } from "@/lib/jwt";
import { refreshTokenSchema } from "@/lib/validations/auth";
import {
  apiSuccess,
  apiBadRequest,
  apiUnauthorized,
  apiServerError,
} from "@/lib/api-response";

export async function POST(request: NextRequest) {
  try {
    // 1. Parse and validate request body
    const body = await request.json();
    const parsed = refreshTokenSchema.safeParse(body);

    if (!parsed.success) {
      const firstError = parsed.error.issues[0];
      return apiBadRequest(firstError.message);
    }

    const { refreshToken } = parsed.data;

    // 2. Verify refresh token
    const payload = await verifyRefreshToken(refreshToken);
    if (!payload) {
      return apiUnauthorized("Invalid or expired refresh token. Please login again.");
    }

    // 3. Verify session still exists (not logged out)
    const session = await prisma.authSession.findUnique({
      where: { id: payload.sessionId },
    });

    if (!session) {
      return apiUnauthorized(
        "Session has been invalidated. Please login again."
      );
    }

    // 4. Verify user still exists and is active
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
    });

    if (!user || !user.isActive) {
      // Delete session — force re-login
      await prisma.authSession.deleteMany({
        where: { userId: payload.userId },
      });

      return apiUnauthorized(
        "Account not found or suspended. Please login again."
      );
    }

    // 5. Delete old session (session rotation — prevents token reuse)
    await prisma.authSession.delete({
      where: { id: payload.sessionId },
    });

    // 6. Create new session and tokens
    const newTokens = await generateTokenPair({
      userId: user.id,
      mobile: user.mobile,
      role: user.role,
      sessionId: "", // Placeholder — set after session creation
    });

    const newSession = await prisma.authSession.create({
      data: {
        userId: user.id,
        token: await hashToken(newTokens.accessToken),
        device: session.device, // Preserve device info from old session
        ip: request.headers.get("x-forwarded-for") || null,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    });

    // 7. Regenerate tokens with proper sessionId
    const finalTokens = await generateTokenPair({
      userId: user.id,
      mobile: user.mobile,
      role: user.role,
      sessionId: newSession.id,
    });

    // Update session with proper token hash
    await prisma.authSession.update({
      where: { id: newSession.id },
      data: { token: await hashToken(finalTokens.accessToken) },
    });

    // 8. Log token refresh event
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

    // 9. Return new token pair
    return apiSuccess(
      {
        tokens: {
          accessToken: finalTokens.accessToken,
          refreshToken: finalTokens.refreshToken,
        },
      },
      "Token refreshed successfully"
    );
  } catch (error) {
    console.error("[REFRESH_ERROR]", error);
    return apiServerError("Token refresh failed. Please login again.");
  }
}

/**
 * Hash a token for storage in AuthSession (SHA-256)
 */
async function hashToken(token: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(token);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}
