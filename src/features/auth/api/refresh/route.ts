/**
 * Purpose: Refresh access token using HttpOnly cookie
 * Endpoint: POST /api/auth/refresh
 */

import { NextRequest, NextResponse } from "next/server";
import { refreshSession } from "@/features/auth/services/session-service";
import { logAuthEvent } from "@/features/auth/services/auth-event-service";
import { setRefreshTokenCookie } from "@/lib/server/cookies";
import { isAppError } from "@/lib/server/errors";
import { ERROR_CODES } from "@/shared/constants";

export async function POST(request: NextRequest) {
  try {
    const { accessToken, refreshToken } = await refreshSession(request);

    const response = NextResponse.json({
      success: true,
      data: { accessToken },
      message: "Token refreshed successfully.",
    }, { status: 200 });

    // Set new refresh token cookie
    setRefreshTokenCookie(response, refreshToken);

    await logAuthEvent("TOKEN_REFRESHED", request, {});

    return response;
  } catch (error: unknown) {
    if (isAppError(error)) {
      return NextResponse.json({ success: false, error: error.code, message: error.message, statusCode: error.statusCode }, { status: error.statusCode });
    }
    console.error("[UNHANDLED_ERROR]", error);
    return NextResponse.json({ success: false, error: ERROR_CODES.SYS_INTERNAL, message: "An unexpected error occurred." }, { status: 500 });
  }
}
