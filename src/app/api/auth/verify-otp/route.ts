/**
 * Purpose: Verify OTP API endpoint for Nikharta Roop auth
 * Responsibility: Validate OTP, login existing user or register new user based on purpose
 *
 * Endpoint: POST /api/auth/verify-otp
 *
 * OpenAPI Summary: Verify OTP and login/register
 * OpenAPI Description: Verify the OTP sent to mobile.
 *   For LOGIN purpose: only logs in existing users (no auto-registration).
 *   For REGISTER purpose: creates new user with provided name, then logs in.
 *   Returns JWT access + refresh tokens. Max 3 verification attempts per OTP.
 *   Session rotation: new AuthSession created on each login.
 *
 * Request Body:
 *   mobile: string (Indian 10-digit) — required
 *   otp: string (6 digits) — required
 *   purpose: "LOGIN" | "REGISTER" — required (default: LOGIN)
 *   name: string (required when purpose is REGISTER)
 *
 * Responses:
 *   200: { success: true, data: { user, tokens, isNewUser } }
 *   400: { success: false, error: "VAL_INVALID_INPUT", message, statusCode: 400 }
 *   401: { success: false, error: "AUTH_OTP_INVALID"|"AUTH_OTP_EXPIRED"|"AUTH_OTP_MAX_ATTEMPTS"|"AUTH_ACCOUNT_SUSPENDED", message, statusCode: 401 }
 *   404: { success: false, error: "AUTH_MOBILE_NOT_REGISTERED", message, statusCode: 404 }
 */

import { createApiHandler } from "@/lib/api-handler";
import { prisma } from "@/lib/prisma";
import { verifyOtp, getMaxAttempts } from "@/lib/otp";
import { createAuthSessionAndTokens } from "@/lib/create-auth-session";
import { logAuthEvent } from "@/lib/auth-helpers";
import { verifyOtpSchema } from "@/lib/validations/auth";
import {
  AuthNoValidOtpError,
  AuthOtpMaxAttemptsError,
  AuthOtpInvalidError,
  AuthAccountSuspendedError,
  AuthMobileNotRegisteredError,
} from "@/lib/errors";

export const POST = createApiHandler({
  schema: verifyOtpSchema,
  handler: async ({ parsedBody, request }) => {
    const { mobile, otp, purpose, name } = parsedBody;

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

    // 6. Handle user based on purpose
    let user;
    let isNewUser = false;

    if (purpose === "REGISTER") {
      // REGISTER: Create new user with provided name and mobile
      // Double-check mobile is not already registered (race condition safety)
      const existingUser = await prisma.user.findUnique({ where: { mobile } });
      if (existingUser) {
        // Mobile got registered between send-otp and verify-otp — just login instead
        user = existingUser;
      } else {
        user = await prisma.user.create({
          data: {
            mobile,
            name: name || null,
            role: "USER",
            authProvider: "MOBILE",
            isActive: true,
            loyaltyPoints: 0,
          },
        });
        isNewUser = true;

        // Link OTP to user
        await prisma.authOtp.update({
          where: { id: otpRecord.id },
          data: { userId: user.id },
        });
      }
    } else {
      // LOGIN: Only login existing users (NO auto-registration)
      user = await prisma.user.findUnique({ where: { mobile } });

      if (!user) {
        await logAuthEvent(mobile, "LOGIN_FAILED", request, { reason: "MOBILE_NOT_REGISTERED" });
        throw new AuthMobileNotRegisteredError();
      }

      // Link OTP to user if not already linked
      if (!otpRecord.userId) {
        await prisma.authOtp.update({
          where: { id: otpRecord.id },
          data: { userId: user.id },
        });
      }
    }

    // 7. Check if user account is active
    if (!user.isActive) {
      await logAuthEvent(mobile, "LOGIN_FAILED", request, { reason: "ACCOUNT_SUSPENDED" }, user.id);
      throw new AuthAccountSuspendedError();
    }

    // 8. Create auth session + generate tokens (using shared helper)
    const authResult = await createAuthSessionAndTokens(user, request);

    // 9. Log successful login
    await logAuthEvent(
      mobile,
      isNewUser ? "REGISTER_EMAIL" : "LOGIN_SUCCESS",
      request,
      { isNewUser, authProvider: "MOBILE", purpose },
      user.id
    );

    // 10. Return tokens and user data
    return {
      ...authResult,
      isNewUser,
    };
  },
  successMessage: undefined, // Dynamic based on isNewUser
});
