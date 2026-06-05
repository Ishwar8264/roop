/**
 * Purpose: Email + Password login
 * Endpoint: POST /api/auth/login-email
 *
 * Sets access + refresh tokens in HttpOnly cookies
 * Tokens are NEVER exposed in JSON
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/database/prisma";
import { verifyPasswordHash } from "@/lib/server/crypto";
import { logAuthEvent } from "@/features/auth/services/auth-event-service";
import { createSession, getUserWithProviders } from "@/features/auth/services/session-service";
import { setAccessTokenCookie, setRefreshTokenCookie } from "@/lib/server/cookies";
import { checkLoginRateLimit, recordFailedLogin, recordSuccessfulLogin } from "@/features/auth/services/login-rate-limit";
import { loginEmailSchema } from "@/features/auth/validations/auth";
import { AuthInvalidCredentialsError, AuthAccountSuspendedError, isAppError } from "@/lib/server/errors";
import { HTTP_STATUS, ERROR_CODES } from "@/shared/constants";

export async function POST(request: NextRequest) {
  try {
    // 1. Validate body
    const body = await request.json();
    const result = loginEmailSchema.safeParse(body);
    if (!result.success) {
      const firstIssue = result.error.issues[0];
      const fieldPath = firstIssue.path.join(".");
      const message = fieldPath ? `${fieldPath}: ${firstIssue.message}` : firstIssue.message;
      return NextResponse.json(
        { success: false, error: ERROR_CODES.VAL_INVALID_INPUT, message, statusCode: HTTP_STATUS.BAD_REQUEST },
        { status: HTTP_STATUS.BAD_REQUEST }
      );
    }

    const { email, password } = result.data;

    // 2. Check login rate limit
    await checkLoginRateLimit(email);

    // 3. Find user by email
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.password) {
      await recordFailedLogin(email);
      await logAuthEvent("LOGIN_FAILED", request, { identifier: email, metadata: { reason: "EMAIL_NOT_FOUND" } });
      throw new AuthInvalidCredentialsError();
    }

    // 4. Verify password
    const isValid = await verifyPasswordHash(password, user.password);
    if (!isValid) {
      await recordFailedLogin(email);
      await logAuthEvent("LOGIN_FAILED", request, { userId: user.id, identifier: email, metadata: { reason: "INVALID_PASSWORD" } });
      throw new AuthInvalidCredentialsError();
    }

    // 5. Check account active
    if (!user.isActive) {
      throw new AuthAccountSuspendedError();
    }

    // 6. Clear failed login attempts
    await recordSuccessfulLogin(email);

    // 7. Create session
    const { accessToken, refreshToken } = await createSession(user.id, user.role as "USER" | "STAFF" | "ADMIN", request);

    // 8. Get user with providers
    const fullUser = await getUserWithProviders(user.id);

    // 9. Build response — tokens are HttpOnly cookies only
    const response = NextResponse.json({
      success: true,
      data: {
        user: fullUser,
      },
      message: "Login successful!",
    }, { status: 200 });

    setRefreshTokenCookie(response, refreshToken);
    setAccessTokenCookie(response, accessToken);

    // 10. Log event
    await logAuthEvent("LOGIN_SUCCESS", request, { userId: user.id, identifier: email, metadata: { authProvider: "EMAIL" } });

    return response;
  } catch (error: unknown) {
    if (isAppError(error)) {
      return NextResponse.json(
        { success: false, error: error.code, message: error.message, statusCode: error.statusCode },
        { status: error.statusCode }
      );
    }
    console.error("[UNHANDLED_ERROR]", error);
    return NextResponse.json(
      { success: false, error: ERROR_CODES.SYS_INTERNAL, message: "An unexpected error occurred.", statusCode: 500 },
      { status: 500 }
    );
  }
}
