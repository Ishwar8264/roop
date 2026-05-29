/**
 * Purpose: Logout API endpoint for Nikharta Roop auth
 * Responsibility: Invalidate JWT session by deleting AuthSession record
 * Important Notes:
 *   - POST /api/auth/logout
 *   - Requires Authorization header: Bearer <accessToken>
 *   - Uses createApiHandler with schema: null (no body)
 */

import { createApiHandler } from "@/lib/api-handler";
import { prisma } from "@/lib/prisma";
import { verifyAccessToken } from "@/lib/jwt";
import { HTTP_MESSAGES } from "@/lib/http";
import {
  AuthMissingTokenError,
  AuthInvalidTokenError,
} from "@/lib/errors";

export const POST = createApiHandler({
  schema: null, // No body — token from Authorization header
  successMessage: HTTP_MESSAGES.AUTH_LOGOUT_SUCCESS.messageEn,
  handler: async ({ request }) => {
    // 1. Extract token from Authorization header
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      throw new AuthMissingTokenError();
    }

    const token = authHeader.split(" ")[1];

    // 2. Verify access token
    const payload = await verifyAccessToken(token);
    if (!payload) {
      throw new AuthInvalidTokenError();
    }

    // 3. Delete auth session record
    const deletedSession = await prisma.authSession.deleteMany({
      where: {
        id: payload.sessionId,
        userId: payload.userId,
      },
    });

    // 4. Log logout event
    await prisma.authEvent.create({
      data: {
        userId: payload.userId,
        mobile: payload.mobile,
        event: "LOGOUT",
        ip: request.headers.get("x-forwarded-for") || null,
        device: request.headers.get("user-agent") || null,
        metadata: {
          sessionId: payload.sessionId,
          sessionDeleted: deletedSession.count > 0,
        },
      },
    });

    return {
      sessionId: payload.sessionId,
    };
  },
});
