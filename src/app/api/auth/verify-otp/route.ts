/**
 * Purpose: Verify OTP API endpoint for Nikharta Roop auth
 * Responsibility: Validate OTP, login existing user or register new user, issue JWT tokens
 *
 * Endpoint: POST /api/auth/verify-otp
 *
 * OpenAPI Summary: Verify OTP and login/register
 * OpenAPI Description: Verify the OTP sent to mobile. If mobile is new, auto-registers as USER.
 *   Returns JWT access + refresh tokens. Max 3 verification attempts per OTP.
 *   Session rotation: new AuthSession created on each login.
 *
 * Request Body:
 *   mobile: string (Indian 10-digit) — required
 *   otp: string (6 digits) — required
 *
 * Responses:
 *   200: { success: true, data: { user, tokens, isNewUser } }
 *   400: { success: false, error: "VAL_INVALID_INPUT", message, statusCode: 400 }
 *   401: { success: false, error: "AUTH_OTP_INVALID"|"AUTH_OTP_EXPIRED"|"AUTH_OTP_MAX_ATTEMPTS"|"AUTH_ACCOUNT_SUSPENDED", message, statusCode: 401 }
 */

import { createApiHandler } from "@/lib/api-handler";
import { prisma } from "@/lib/prisma";
import { verifyOtp, getMaxAttempts } from "@/lib/otp";
import { generateTokenPair } from "@/lib/jwt";
import { hashTokenSha256 } from "@/lib/crypto";
import { logAuthEvent } from "@/lib/auth-helpers";
import { verifyOtpSchema } from "@/lib/validations/auth";
import {
  AuthNoValidOtpError,
  AuthOtpMaxAttemptsError,
  AuthOtpInvalidError,
  AuthAccountSuspendedError,
} from "@/lib/errors";

export const POST = createApiHandler({
  schema: verifyOtpSchema,
  handler: async ({ parsedBody, request }) => {
    const { mobile, otp } = parsedBody;

    // 1. Find the latest valid (unused, not expired) OTP
    const otpRecord = await prisma.authOtp.findFirst({
      where: {
        mobile,
        isUsed: false,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: "desc" },
    });

    if (!otpRecord) {
      await logAuthEvent(mobile, "LOGIN_FAILED", request, { reason: "NO_VALID_OTP" });
      throw new AuthNoValidOtpError();
    }

    // 2. Check if max attempts exceeded
    if (otpRecord.attempts >= getMaxAttempts()) {
      await prisma.authOtp.update({
        where: { id: otpRecord.id },
        data: { isUsed: true },
      });
      await logAuthEvent(mobile, "LOGIN_FAILED", request, { reason: "MAX_ATTEMPTS_EXCEEDED" });
      throw new AuthOtpMaxAttemptsError();
    }

    // 3. Increment attempt counter
    await prisma.authOtp.update({
      where: { id: otpRecord.id },
      data: { attempts: { increment: 1 } },
    });

    // 4. Verify OTP (bcrypt compare)
    const isValidOtp = await verifyOtp(otp, otpRecord.otp);
    if (!isValidOtp) {
      const attemptsRemaining = getMaxAttempts() - otpRecord.attempts - 1;
      await logAuthEvent(mobile, "LOGIN_FAILED", request, {
        reason: "INVALID_OTP",
        attemptsRemaining,
      });
      throw new AuthOtpInvalidError(attemptsRemaining);
    }

    // 5. Mark OTP as used
    await prisma.authOtp.update({
      where: { id: otpRecord.id },
      data: { isUsed: true },
    });

    // 6. Find or create user (auto-registration)
    let user = await prisma.user.findUnique({ where: { mobile } });
    let isNewUser = false;

    if (!user) {
      user = await prisma.user.create({
        data: {
          mobile,
          role: "USER",
          isActive: true,
          loyaltyPoints: 0,
        },
      });
      isNewUser = true;
    }

    // 7. Check if user account is active
    if (!user.isActive) {
      await logAuthEvent(mobile, "LOGIN_FAILED", request, { reason: "ACCOUNT_SUSPENDED" }, user.id);
      throw new AuthAccountSuspendedError();
    }

    // 8. Create auth session + generate JWT tokens
    const session = await prisma.authSession.create({
      data: {
        userId: user.id,
        token: "placeholder", // Will update after token generation
        device: request.headers.get("user-agent") || null,
        ip: request.headers.get("x-forwarded-for") || null,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    const tokens = await generateTokenPair({
      userId: user.id,
      mobile: user.mobile,
      role: user.role,
      sessionId: session.id,
    });

    // Update session with token hash (using centralized crypto utility)
    const tokenHash = await hashTokenSha256(tokens.accessToken);
    await prisma.authSession.update({
      where: { id: session.id },
      data: { token: tokenHash },
    });

    // 9. Update user's lastLoginAt
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // 10. Log successful login
    await logAuthEvent(
      mobile,
      "LOGIN_SUCCESS",
      request,
      { isNewUser, sessionId: session.id },
      user.id
    );

    // 11. Return tokens and user data
    return {
      user: {
        id: user.id,
        mobile: user.mobile,
        name: user.name,
        email: user.email,
        role: user.role,
        avatarUrl: user.avatarUrl,
        loyaltyPoints: user.loyaltyPoints,
      },
      tokens: {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      },
      isNewUser,
    };
  },
  successMessage: undefined, // Dynamic based on isNewUser
});
