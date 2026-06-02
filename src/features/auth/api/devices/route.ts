/**
 * Purpose: List active devices/sessions
 * Endpoint: GET /api/auth/devices
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAuth, listUserSessions } from "@/features/auth/services/session-service";
import { isAppError } from "@/lib/server/errors";
import { ERROR_CODES } from "@/shared/constants";

export async function GET(request: NextRequest) {
  try {
    const payload = await requireAuth(request);
    const devices = await listUserSessions(payload.userId, payload.sessionId);
    return NextResponse.json({ success: true, data: { devices } }, { status: 200 });
  } catch (error: unknown) {
    if (isAppError(error)) {
      return NextResponse.json({ success: false, error: error.code, message: error.message, statusCode: error.statusCode }, { status: error.statusCode });
    }
    console.error("[UNHANDLED_ERROR]", error);
    return NextResponse.json({ success: false, error: ERROR_CODES.SYS_INTERNAL, message: "An unexpected error occurred." }, { status: 500 });
  }
}
