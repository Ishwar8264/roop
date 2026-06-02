/**
 * Purpose: Confirm email verification with OTP
 * Endpoint: POST /api/user/verify-email/confirm
 *
 * Flow:
 *   1. Require auth (requireAuthWithSession)
 *   2. Validate with verifyEmailOtpSchema (otp)
 *   3. Find unused EMAIL_OTP VerificationToken for this user
 *   4. Verify OTP with verifyOtpHash()
 *   5. Mark token as used
 *   6. Set emailVerified = true on user
 *   7. Return success message
 */

import { createApiHandler } from "@/lib/server/api-handler";
import { prisma } from "@/lib/database/prisma";
import { requireAuthWithSession } from "@/features/auth/services/session-service";
import { verifyOtpHash } from "@/lib/server/crypto";
import { verifyEmailOtpSchema } from "@/features/user/validations/user";
import { AuthOtpInvalidError, AuthOtpExpiredError } from "@/lib/server/errors";
import type { VerifyEmailOtpInput } from "@/features/user/validations/user";

export const POST = createApiHandler<VerifyEmailOtpInput, { message: string }>({
  schema: verifyEmailOtpSchema,
  handler: async ({ parsedBody, request }) => {
    // 1. Require authenticated user with valid session
    const { user } = await requireAuthWithSession(request);

    const { otp } = parsedBody;

    // 2. Get user's email
    const fullUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { id: true, email: true },
    });

    if (!fullUser || !fullUser.email) {
      throw new AuthOtpInvalidError();
    }

    // 3. Find unused EMAIL_OTP tokens for this user's email
    const emailOtpTokens = await prisma.verificationToken.findMany({
      where: {
        identifier: fullUser.email,
        type: "EMAIL_OTP",
        userId: user.id,
        usedAt: null,
      },
      orderBy: { createdAt: "desc" },
    });

    if (emailOtpTokens.length === 0) {
      throw new AuthOtpExpiredError();
    }

    // 4. Verify OTP against hashed tokens
    let matchedToken: (typeof emailOtpTokens)[number] | null = null;

    for (const tokenRecord of emailOtpTokens) {
      const isValid = await verifyOtpHash(otp, tokenRecord.token);
      if (isValid) {
        matchedToken = tokenRecord;
        break;
      }
    }

    if (!matchedToken) {
      throw new AuthOtpInvalidError();
    }

    // 5. Check if token is expired
    if (matchedToken.expiresAt < new Date()) {
      await prisma.verificationToken.update({
        where: { id: matchedToken.id },
        data: { usedAt: new Date() },
      });
      throw new AuthOtpExpiredError();
    }

    // 6. Mark token as used
    await prisma.verificationToken.update({
      where: { id: matchedToken.id },
      data: { usedAt: new Date() },
    });

    // 7. Set emailVerified = true on user
    await prisma.user.update({
      where: { id: user.id },
      data: { emailVerified: true },
    });

    return { message: "Email verified successfully." };
  },
  successMessage: "Email verified successfully.",
});
