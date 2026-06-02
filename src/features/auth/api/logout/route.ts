/**
 * Purpose: Logout — revoke current session
 * Endpoint: POST /api/auth/logout
 */

import { NextRequest, NextResponse } from "next/server";
import { revokeSession, requireAuth } from "@/features/auth/services/session-service";
import { logAuthEvent } from "@/features/auth/services/auth-event-service";
import { clearRefreshTokenCookie } from "@/lib/server/cookies";
import { isAppError } from "@/lib/server/errors";
import { ERROR_CODES } from "@/shared/constants";

export async function POST(request: NextRequest) {
  try {
    const payload = await requireAuth(request);
    await revokeSession(payload.sessionId, payload.userId);

    const response = NextResponse.json({
      success: true,
      data: { sessionId: payload.sessionId },
      message: "Logged out successfully.",
    }, { status: 200 });

    clearRefreshTokenCookie(response);

    await logAuthEvent("LOGOUT", request, { userId: payload.userId, metadata: { sessionId: payload.sessionId } });

    return response;
  } catch (error: unknown) {
    if (isAppError(error)) {
      return NextResponse.json({ success: false, error: error.code, message: error.message, statusCode: error.statusCode }, { status: error.statusCode });
    }
    console.error("[UNHANDLED_ERROR]", error);
    return NextResponse.json({ success: false, error: ERROR_CODES.SYS_INTERNAL, message: "An unexpected error occurred." }, { status: 500 });
  }
}
