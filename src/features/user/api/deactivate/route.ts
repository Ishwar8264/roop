/**
 * Purpose: Deactivate user account
 * Endpoint: POST /api/user/deactivate
 *
 * Flow:
 *   1. Require auth (requireAuthWithSession)
 *   2. Validate with deactivateAccountSchema (confirmation + optional reason)
 *   3. Set isActive = false on user
 *   4. Revoke ALL user sessions
 *   5. Clear refresh token cookie
 *   6. Log ACCOUNT_DEACTIVATED auth event
 *   7. Return farewell message
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/database/prisma";
import {
  requireAuthWithSession,
  revokeAllUserSessions,
} from "@/features/auth/services/session-service";
import { logAuthEvent } from "@/features/auth/services/auth-event-service";
import { clearRefreshTokenCookie } from "@/lib/server/cookies";
import { deactivateAccountSchema } from "@/features/user/validations/user";
import { isAppError, toAppError } from "@/lib/server/errors";
import { HTTP_STATUS, ERROR_CODES } from "@/shared/constants";
import type { DeactivateAccountInput } from "@/features/user/validations/user";

export async function POST(request: NextRequest) {
  try {
    // 1. Require authenticated user with valid session
    const { user } = await requireAuthWithSession(request);

    // 2. Parse and validate request body
    let parsedBody: DeactivateAccountInput;
    try {
      const body = await request.json();
      const result = deactivateAccountSchema.safeParse(body);
      if (!result.success) {
        const firstIssue = result.error.issues[0];
        const fieldPath = firstIssue.path.join(".");
        const message = fieldPath
          ? `${fieldPath}: ${firstIssue.message}`
          : firstIssue.message;
        return NextResponse.json(
          {
            success: false,
            error: ERROR_CODES.VAL_INVALID_INPUT,
            message,
            statusCode: HTTP_STATUS.BAD_REQUEST,
          },
          { status: HTTP_STATUS.BAD_REQUEST }
        );
      }
      parsedBody = result.data;
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: ERROR_CODES.VAL_INVALID_INPUT,
          message: "Invalid JSON in request body.",
          statusCode: HTTP_STATUS.BAD_REQUEST,
        },
        { status: HTTP_STATUS.BAD_REQUEST }
      );
    }

    // 3. Set isActive = false on user
    await prisma.user.update({
      where: { id: user.id },
      data: { isActive: false },
    });

    // 4. Revoke ALL user sessions
    await revokeAllUserSessions(user.id);

    // 5. Log ACCOUNT_DEACTIVATED auth event
    await logAuthEvent("ACCOUNT_DEACTIVATED", request, {
      userId: user.id,
      metadata: {
        reason: parsedBody.reason || undefined,
      },
    });

    // 6. Build response and clear refresh token cookie
    const response = NextResponse.json(
      {
        success: true,
        data: {
          message:
            "Account deactivated successfully. We're sorry to see you go.",
        },
        message:
          "Account deactivated successfully. We're sorry to see you go.",
      },
      { status: HTTP_STATUS.OK }
    );

    clearRefreshTokenCookie(response);

    return response;
  } catch (error: unknown) {
    if (isAppError(error)) {
      return NextResponse.json(
        {
          success: false,
          error: error.code,
          message: error.message,
          statusCode: error.statusCode,
        },
        { status: error.statusCode }
      );
    }

    const appError = toAppError(error);
    console.error("[UNHANDLED_ERROR]", error);

    return NextResponse.json(
      {
        success: false,
        error: appError.code,
        message: appError.message,
        statusCode: appError.statusCode,
      },
      { status: appError.statusCode }
    );
  }
}
