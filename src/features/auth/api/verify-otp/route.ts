/**
 * Purpose: Verify OTP and login/register
 * Endpoint: POST /api/auth/verify-otp
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/database/prisma";
import { verifyStoredOtp } from "@/features/auth/services/otp-service";
import { logAuthEvent } from "@/features/auth/services/auth-event-service";
import { createSession, getUserWithProviders } from "@/features/auth/services/session-service";
import { setRefreshTokenCookie } from "@/lib/server/cookies";
import { recordSuccessfulLogin } from "@/features/auth/services/login-rate-limit";
import { verifyOtpSchema } from "@/features/auth/validations/auth";
import { AuthAccountSuspendedError, isAppError } from "@/lib/server/errors";
import { ERROR_CODES } from "@/shared/constants";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = verifyOtpSchema.safeParse(body);
    if (!result.success) {
      const firstIssue = result.error.issues[0];
      const fieldPath = firstIssue.path.join(".");
      const message = fieldPath ? `${fieldPath}: ${firstIssue.message}` : firstIssue.message;
      return NextResponse.json({ success: false, error: ERROR_CODES.VAL_INVALID_INPUT, message, statusCode: 400 }, { status: 400 });
    }

    const { phone, otp } = result.data;

    // 1. Verify OTP from Redis
    await verifyStoredOtp(phone, otp);

    // 2. Find or create user
    let user = await prisma.user.findUnique({ where: { phone } });
    let isNewUser = false;

    if (!user) {
      user = await prisma.$transaction(async (tx) => {
        const newUser = await tx.user.create({ data: { phone, phoneVerified: true, role: "USER", isActive: true, loyaltyPoints: 0 } });
        await tx.account.create({ data: { userId: newUser.id, provider: "MOBILE", providerAccountId: phone } });
        return newUser;
      });
      isNewUser = true;
    } else if (!user.phoneVerified) {
      await prisma.user.update({ where: { id: user.id }, data: { phoneVerified: true } });
    }

    // 3. Check active
    if (!user.isActive) {
      throw new AuthAccountSuspendedError();
    }

    // 4. Clear failed attempts
    await recordSuccessfulLogin(phone);

    // 5. Create session
    const { accessToken, refreshToken } = await createSession(user.id, user.role as "USER" | "STAFF" | "ADMIN", request);

    // 6. Get user with providers
    const fullUser = await getUserWithProviders(user.id);

    // 7. Build response — accessToken in JSON, refreshToken in HttpOnly cookie ONLY
    const response = NextResponse.json({
      success: true,
      data: { user: fullUser, tokens: { accessToken }, isNewUser },
      ...(isNewUser && { message: "Registration successful! Welcome to Nikharta Roop." }),
    }, { status: isNewUser ? 201 : 200 });

    setRefreshTokenCookie(response, refreshToken);

    await logAuthEvent(isNewUser ? "REGISTER_PHONE" : "LOGIN_SUCCESS", request, { userId: user.id, identifier: phone, metadata: { authProvider: "MOBILE", isNewUser } });

    return response;
  } catch (error: unknown) {
    if (isAppError(error)) {
      return NextResponse.json({ success: false, error: error.code, message: error.message, statusCode: error.statusCode }, { status: error.statusCode });
    }
    console.error("[UNHANDLED_ERROR]", error);
    return NextResponse.json({ success: false, error: ERROR_CODES.SYS_INTERNAL, message: "An unexpected error occurred.", statusCode: 500 }, { status: 500 });
  }
}
