/**
 * Purpose: Logout API endpoint for Nikharta Roop auth
 * Responsibility: Invalidate JWT session by deleting AuthSession record
 *
 * Endpoint: POST /api/auth/logout
 *
 * OpenAPI Summary: Logout and invalidate session
 * OpenAPI Description: Invalidate the current JWT session by deleting the AuthSession record.
 *   Requires Bearer token in Authorization header.
 *
 * Security: BearerAuth (JWT access token)
 *
 * Responses:
 *   200: { success: true, data: { sessionId }, message }
 *   401: { success: false, error: "AUTH_MISSING_TOKEN"|"AUTH_INVALID_TOKEN", message, statusCode: 401 }
 */

import { createApiHandler } from "@/lib/api-handler";
import { prisma } from "@/lib/prisma";
import { requireAuth, logAuthEvent } from "@/lib/auth-helpers";
import { HTTP_MESSAGES } from "@/lib/http";

export const POST = createApiHandler({
  schema: null, // No body — token from Authorization header
  successMessage: HTTP_MESSAGES.AUTH_LOGOUT_SUCCESS.messageEn,
  handler: async ({ request }) => {
    // 1. Extract and verify token (using centralized auth helper)
    const payload = await requireAuth(request);

    // 2. Delete auth session record
    const deletedSession = await prisma.authSession.deleteMany({
      where: {
        id: payload.sessionId,
        userId: payload.userId,
      },
    });

    // 3. Log logout event (using centralized logAuthEvent)
    await logAuthEvent(
      payload.mobile,
      "LOGOUT",
      request,
      {
        sessionId: payload.sessionId,
        sessionDeleted: deletedSession.count > 0,
      },
      payload.userId
    );

    return {
      sessionId: payload.sessionId,
    };
  },
});
