/**
 * Purpose: Revoke a specific session (logout from one device)
 * Endpoint: POST /api/auth/revoke-session
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAuth, revokeSession } from "@/features/auth/services/session-service";
import { logAuthEvent } from "@/features/auth/services/auth-event-service";
import { revokeSessionSchema } from "@/features/auth/validations/auth";
import { isAppError } from "@/lib/server/errors";
import { ERROR_CODES } from "@/shared/constants";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = revokeSessionSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ success: false, error: ERROR_CODES.VAL_INVALID_INPUT, message: result.error.issues[0].message }, { status: 400 });
    }

    const { sessionId } = result.data;
    const payload = await requireAuth(request);

    await Promise.all([
      revokeSession(sessionId, payload.userId),
      logAuthEvent("DEVICE_REVOKED", request, { userId: payload.userId, metadata: { revokedSessionId: sessionId } }),
    ]);

    return NextResponse.json({ success: true, data: { revokedSessionId: sessionId }, message: "Device logged out successfully." }, { status: 200 });
  } catch (error: unknown) {
    if (isAppError(error)) {
      return NextResponse.json({ success: false, error: error.code, message: error.message, statusCode: error.statusCode }, { status: error.statusCode });
    }
    console.error("[UNHANDLED_ERROR]", error);
    return NextResponse.json({ success: false, error: ERROR_CODES.SYS_INTERNAL, message: "An unexpected error occurred." }, { status: 500 });
  }
}
