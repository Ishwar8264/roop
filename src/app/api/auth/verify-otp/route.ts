/**
 * Purpose: Verify OTP API endpoint for Nikharta Roop auth
 * Responsibility: Validate OTP, login existing user or register new user, issue JWT tokens
 * Important Notes:
 *   - POST /api/auth/verify-otp
 *   - Uses createApiHandler for standardized error handling
 *   - All error classes centralized in errors.ts
 *   - Auto-registers new users (isNewUser flag)
 *   - Session rotation on token generation
 */

import { createApiHandler } from "@/lib/api-handler";
import { prisma } from "@/lib/prisma";
import { verifyOtp, getMaxAttempts } from "@/lib/otp";
import { generateTokenPair } from "@/lib/jwt";
import { verifyOtpSchema } from "@/lib/validations/auth";
import { HTTP_MESSAGES } from "@/lib/http";
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
      await logAuthEvent(prisma, mobile, "LOGIN_FAILED", request, { reason: "NO_VALID_OTP" });
      throw new AuthNoValidOtpError();
    }

    // 2. Check if max attempts exceeded
    if (otpRecord.attempts >= getMaxAttempts()) {
      await prisma.authOtp.update({
        where: { id: otpRecord.id },
        data: { isUsed: true },
      });
      await logAuthEvent(prisma, mobile, "LOGIN_FAILED", request, { reason: "MAX_ATTEMPTS_EXCEEDED" });
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
      await logAuthEvent(prisma, mobile, "LOGIN_FAILED", request, {
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
      await logAuthEvent(prisma, mobile, "LOGIN_FAILED", request, { reason: "ACCOUNT_SUSPENDED" }, user.id);
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

    // Update session with token hash
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
    await logAuthEvent(prisma, mobile, "LOGIN_SUCCESS", request, { isNewUser, sessionId: session.id }, user.id);

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
  successMessage: undefined, // Set dynamically based on isNewUser — handler returns data directly
});

// ==================== HELPERS ====================

async function logAuthEvent(
  prisma: import("@prisma/client").PrismaClient,
  mobile: string,
  event: string,
  request: import("next/server").NextRequest,
  metadata: Record<string, unknown>,
  userId?: string
) {
  await prisma.authEvent.create({
    data: {
      userId: userId || null,
      mobile,
      event: event as "LOGIN_SUCCESS" | "LOGIN_FAILED",
      ip: request.headers.get("x-forwarded-for") || null,
      device: request.headers.get("user-agent") || null,
      metadata: metadata as import("@prisma/client").Prisma.InputJsonValue,
    },
  });
}

async function hashTokenSha256(token: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(token);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}
