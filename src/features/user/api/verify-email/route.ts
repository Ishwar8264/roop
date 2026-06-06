/**
 * Purpose: Resend email verification OTP
 * Endpoint: POST /api/user/verify-email
 *
 * Flow:
 *   1. Require auth (requireAuthWithSession)
 *   2. If user's email is already verified → return message
 *   3. Generate 6-digit OTP using generateOtp()
 *   4. Hash OTP, store in VerificationToken table with type EMAIL_OTP, expires in 10 min
 *   5. Send email with OTP (stubbed: console.warn)
 *   6. Return success message
 */

import { createApiHandler } from "@/lib/server/api-handler";
import { prisma } from "@/lib/database/prisma";
import { requireAuthWithSession } from "@/features/auth/services/session-service";
import { generateOtp, hashOtp } from "@/lib/server/crypto";
import { resendVerificationSchema } from "@/features/user/validations/user";
import type { ResendVerificationInput } from "@/features/user/validations/user";

const EMAIL_OTP_EXPIRY_SECONDS = 10 * 60; // 10 minutes

export const POST = createApiHandler<ResendVerificationInput, { message: string }>({
  schema: resendVerificationSchema,
  handler: async ({ parsedBody: _parsedBody, request }) => {
    // 1. Require authenticated user with valid session
    const { user } = await requireAuthWithSession(request);

    // 2. Get user's email
    const fullUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { id: true, email: true, emailVerified: true },
    });

    if (!fullUser || !fullUser.email) {
      return {
        message: "No email address found on your account.",
      };
    }

    // 3. If email is already verified
    if (fullUser.emailVerified) {
      return {
        message: "Your email is already verified.",
      };
    }

    // 4. Generate 6-digit OTP
    const otp = generateOtp(6);
    const hashedOtp = await hashOtp(otp);

    // 5. Invalidate previous tokens + store new OTP (parallel — independent operations)
    await Promise.all([
      prisma.verificationToken.updateMany({
        where: {
          identifier: fullUser.email,
          type: "EMAIL_OTP",
          usedAt: null,
        },
        data: { usedAt: new Date() },
      }),
      prisma.verificationToken.create({
        data: {
          userId: fullUser.id,
          identifier: fullUser.email,
          token: hashedOtp,
          type: "EMAIL_OTP",
          expiresAt: new Date(Date.now() + EMAIL_OTP_EXPIRY_SECONDS * 1000),
        },
      }),
    ]);

    // 7. Send email with OTP (stubbed — replace with real email service)
    console.warn(
      `[STUB_EMAIL] Email verification OTP sent to user ${fullUser.id}`
    );

    return {
      message: "Verification OTP sent to your email.",
    };
  },
  successMessage: "Verification OTP sent to your email.",
});
