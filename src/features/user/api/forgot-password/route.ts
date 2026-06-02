/**
 * Purpose: Forgot password — send password reset link
 * Endpoint: POST /api/auth/forgot-password
 *
 * Flow:
 *   1. Validate email with forgotPasswordSchema
 *   2. Find user by email (don't reveal if email exists)
 *   3. If user exists: generate reset token, hash it, store in VerificationToken
 *   4. Invalidate previous unused PASSWORD_RESET tokens for this email
 *   5. Send email with reset link (stubbed — no token/PII in logs)
 *   6. Always return success (security: no email enumeration)
 */

import { createApiHandler } from "@/lib/server/api-handler";
import { prisma } from "@/lib/database/prisma";
import { generateMagicLinkToken, hashOtp } from "@/lib/server/crypto";
import { logAuthEvent } from "@/features/auth/services/auth-event-service";
import { forgotPasswordSchema } from "@/features/user/validations/user";
import { APP_URL } from "@/shared/constants";
import type { ForgotPasswordInput } from "@/features/user/validations/user";

const PASSWORD_RESET_EXPIRY_SECONDS = 30 * 60; // 30 minutes

export const POST = createApiHandler<ForgotPasswordInput, { message: string }>({
  schema: forgotPasswordSchema,
  handler: async ({ parsedBody, request }) => {
    const { email } = parsedBody;

    // Find user by email — but never reveal if it doesn't exist
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, name: true },
    });

    if (user) {
      // Invalidate previous unused PASSWORD_RESET tokens for this email
      await prisma.verificationToken.updateMany({
        where: {
          identifier: email,
          type: "PASSWORD_RESET",
          usedAt: null,
        },
        data: { usedAt: new Date() },
      });

      // Generate a password reset token
      const rawToken = generateMagicLinkToken();
      const hashedToken = await hashOtp(rawToken);

      // Store the hashed token in VerificationToken table
      await prisma.verificationToken.create({
        data: {
          userId: user.id,
          identifier: email,
          token: hashedToken,
          type: "PASSWORD_RESET",
          expiresAt: new Date(Date.now() + PASSWORD_RESET_EXPIRY_SECONDS * 1000),
        },
      });

      // Build the reset link — NO email in URL (PII protection)
      const resetLink = `${APP_URL}/reset-password?token=${rawToken}`;

      // Send email (stubbed — no sensitive data in logs)
      console.log(`[STUB_EMAIL] Password reset email sent to user ${user.id}`);

      // Log auth event
      await logAuthEvent("PASSWORD_RESET_REQUESTED", request, {
        userId: user.id,
        identifier: email,
      });
    }

    // Always return the same response — no email enumeration
    return {
      message: "If this email is registered, a reset link has been sent.",
    };
  },
  successMessage: "If this email is registered, a reset link has been sent.",
});
