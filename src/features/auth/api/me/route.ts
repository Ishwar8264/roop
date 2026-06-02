/**
 * Purpose: Get current authenticated user
 * Endpoint: GET /api/auth/me
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAuthWithSession, touchSessionThrottled, getUserWithProviders } from "@/features/auth/services/session-service";
import { isAppError } from "@/lib/server/errors";
import { ERROR_CODES } from "@/shared/constants";

export async function GET(request: NextRequest) {
  try {
    const { payload } = await requireAuthWithSession(request);

    // Throttled touch — updates DB at most once per 5 minutes
    await touchSessionThrottled(payload.sessionId);

    const user = await getUserWithProviders(payload.userId);
    if (!user) {
      return NextResponse.json({ success: false, error: ERROR_CODES.AUTH_INVALID_TOKEN, message: "User not found." }, { status: 401 });
    }

    return NextResponse.json({ success: true, data: { user } }, { status: 200 });
  } catch (error: unknown) {
    if (isAppError(error)) {
      return NextResponse.json({ success: false, error: error.code, message: error.message, statusCode: error.statusCode }, { status: error.statusCode });
    }
    console.error("[UNHANDLED_ERROR]", error);
    return NextResponse.json({ success: false, error: ERROR_CODES.SYS_INTERNAL, message: "An unexpected error occurred.", statusCode: 500 }, { status: 500 });
  }
}
