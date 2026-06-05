/**
 * Purpose: Verify OTP API endpoint for Nikharta Roop auth
 * Responsibility: Validate OTP, login existing user or register new user based on purpose
 *
 * Endpoint: POST /api/auth/verify-otp
 *
 * Request Body:
 *   mobile?: string (Indian 10-digit) — for phone OTP
 *   email?: string (valid email) — for email OTP
 *   otp: string (6 digits) — required
 *   purpose: "LOGIN" | "REGISTER" — required (default: LOGIN)
 *   name?: string (required when purpose is REGISTER)
 *   username?: string
 *   email?: string
 *   password?: string
 *   At least one of mobile or email must be provided
 *
 * Responses:
 *   200: { success: true, data: { user, isNewUser } }
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
import { hashPassword } from "@/lib/server/crypto";
import { setRefreshTokenCookie, setAccessTokenCookie } from "@/lib/server/cookies";
import {
  AuthNoValidOtpError,
  AuthOtpMaxAttemptsError,
  AuthOtpInvalidError,
  AuthAccountSuspendedError,
  AuthMobileNotRegisteredError,
  AuthEmailNotRegisteredError,
  AuthEmailExistsError,
  AuthUsernameExistsError,
} from "@/lib/errors";
import { NextResponse } from "next/server";

export const POST = createApiHandler({
  schema: verifyOtpSchema,
  handler: async ({ parsedBody, request }) => {
    const { mobile, email, otp, purpose, name, username, password } = parsedBody;

    // Determine identifier for OTP lookup
    const identifier = mobile || email!;

    // 1. Find the latest valid (unused, not expired) OTP
    const otpRecord = await prisma.authOtp.findFirst({
      where: {
        mobile: identifier,
        isUsed: false,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: "desc" },
    });

    if (!otpRecord) {
      await logAuthEvent(identifier, "LOGIN_FAILED", request, { reason: "NO_VALID_OTP" });
      throw new AuthNoValidOtpError();
    }

    // 2. Check if max attempts exceeded
    if (otpRecord.attempts >= getMaxAttempts()) {
      await prisma.authOtp.update({
        where: { id: otpRecord.id },
        data: { isUsed: true },
      });
      await logAuthEvent(identifier, "LOGIN_FAILED", request, { reason: "MAX_ATTEMPTS_EXCEEDED" });
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
      await logAuthEvent(identifier, "LOGIN_FAILED", request, {
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
      // REGISTER: Create new user with provided details
      // Double-check identifier is not already registered (race condition safety)
      if (mobile) {
        const existingByMobile = await prisma.user.findUnique({ where: { mobile } });
        if (existingByMobile) {
          // Mobile got registered between send-otp and verify-otp — just login instead
          user = existingByMobile;
        }
      }

      if (!user && email) {
        const existingByEmail = await prisma.user.findUnique({ where: { email } });
        if (existingByEmail) {
          throw new AuthEmailExistsError();
        }
      }

      if (!user) {
        // Check if username is already taken
        if (username) {
          const existingUsername = await prisma.user.findUnique({ where: { username } });
          if (existingUsername) {
            throw new AuthUsernameExistsError();
          }
        }

        // Hash password if provided
        const hashedPassword = password ? await hashPassword(password) : undefined;

        // Determine auth provider
        const authProvider = mobile ? "MOBILE" : "EMAIL";

        user = await prisma.user.create({
          data: {
            mobile: mobile || null,
            email: email || null,
            username: username || null,
            name: name || null,
            password: hashedPassword || null,
            role: "USER",
            authProvider,
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
      if (mobile) {
        user = await prisma.user.findUnique({ where: { mobile } });
      } else if (email) {
        user = await prisma.user.findUnique({ where: { email } });
      }

      if (!user) {
        await logAuthEvent(identifier, "LOGIN_FAILED", request, { reason: "NOT_REGISTERED" });
        if (email && !mobile) {
          throw new AuthEmailNotRegisteredError();
        }
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
      await logAuthEvent(identifier, "LOGIN_FAILED", request, { reason: "ACCOUNT_SUSPENDED" }, user.id);
      throw new AuthAccountSuspendedError();
    }

    // 8. Create auth session + generate tokens (using shared helper)
    const authResult = await createAuthSessionAndTokens(user, request);

    // 9. Log successful login
    await logAuthEvent(
      identifier,
      isNewUser ? "REGISTER_EMAIL" : "LOGIN_SUCCESS",
      request,
      { isNewUser, authProvider: user.authProvider, purpose },
      user.id
    );

    // 10. Return public user data; tokens are set as HttpOnly cookies below
    return {
      ...authResult,
      isNewUser,
    };
  },
  successMessage: undefined, // Dynamic based on isNewUser
  // Custom response builder to set refresh token as HttpOnly cookie
  responseBuilder: (data) => {
    const { tokens, ...publicData } = data as Record<string, unknown>;
    const tokenData = tokens as { accessToken: string; refreshToken: string } | undefined;

    const response = NextResponse.json(
      {
        success: true,
        data: {
          ...publicData,
        },
      },
      { status: 200 }
    );

    if (tokenData?.refreshToken) {
      setRefreshTokenCookie(response, tokenData.refreshToken);
    }

    // Also set access token as short-lived cookie — backup for page route auth
    // Some browsers don't store cookies from fetch() Set-Cookie reliably
    if (tokenData?.accessToken) {
      setAccessTokenCookie(response, tokenData.accessToken);
    }

    return response;
  },
});
