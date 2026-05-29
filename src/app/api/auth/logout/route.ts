/**
 * Purpose: Logout API endpoint for Nikharta Roop auth
 * Responsibility: Invalidate JWT session by deleting AuthSession record
 * Important Notes:
 *   - POST /api/auth/logout
 *   - Requires Authorization header: Bearer <accessToken>
 *   - Deletes AuthSession record so token can no longer be refreshed
 *   - Client should also delete stored tokens locally
 *   - Logs AuthEvent for audit trail
 */

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAccessToken } from "@/lib/jwt";
import {
  apiSuccess,
  apiUnauthorized,
  apiServerError,
} from "@/lib/api-response";

export async function POST(request: NextRequest) {
  try {
    // 1. Extract token from Authorization header
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return apiUnauthorized("Missing or invalid authorization header");
    }

    const token = authHeader.split(" ")[1];

    // 2. Verify access token
    const payload = await verifyAccessToken(token);
    if (!payload) {
      return apiUnauthorized("Invalid or expired token");
    }

    // 3. Delete auth session record — invalidates the session
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

    // 5. Return success — client should also clear local tokens
    return apiSuccess(
      {
        sessionId: payload.sessionId,
      },
      "Logged out successfully"
    );
  } catch (error) {
    console.error("[LOGOUT_ERROR]", error);
    return apiServerError("Logout failed. Please try again.");
  }
}
