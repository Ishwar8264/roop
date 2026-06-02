/**
 * Purpose: Reset password using the token from forgot-password email
 * Endpoint: POST /api/auth/reset-password
 *
 * Flow:
 *   1. Validate with resetPasswordSchema (token + password)
 *   2. Find unused PASSWORD_RESET tokens (limited scan for DoS protection)
 *   3. Match the token using verifyOtpHash()
 *   4. If no match or expired → throw appropriate error
 *   5. Mark token as used
 *   6. Hash new password, update user
 *   7. Revoke ALL user sessions (force re-login)
 *   8. Log PASSWORD_RESET_COMPLETED auth event
 */

import { createApiHandler } from "@/lib/server/api-handler";
import { prisma } from "@/lib/database/prisma";
import { verifyOtpHash, hashPassword } from "@/lib/server/crypto";
import { revokeAllUserSessions } from "@/features/auth/services/session-service";
import { logAuthEvent } from "@/features/auth/services/auth-event-service";
import { resetPasswordSchema } from "@/features/user/validations/user";
import {
  AuthPasswordResetInvalidError,
  AuthPasswordResetExpiredError,
} from "@/lib/server/errors";
import type { ResetPasswordInput } from "@/features/user/validations/user";

export const POST = createApiHandler<ResetPasswordInput, { message: string }>({
  schema: resetPasswordSchema,
  handler: async ({ parsedBody, request }) => {
    const { token, password } = parsedBody;

    // 1. Find unused PASSWORD_RESET tokens (limited scan for DoS protection)
    const resetTokens = await prisma.verificationToken.findMany({
      where: {
        type: "PASSWORD_RESET",
        usedAt: null,
      },
      orderBy: { createdAt: "desc" },
      take: 50, // Limit scan to recent 50 tokens max
    });

    // 2. Match the provided raw token against hashed tokens
    let matchedToken: (typeof resetTokens)[number] | null = null;

    for (const resetToken of resetTokens) {
      const isValid = await verifyOtpHash(token, resetToken.token);
      if (isValid) {
        matchedToken = resetToken;
        break;
      }
    }

    // 3. No matching token found
    if (!matchedToken) {
      throw new AuthPasswordResetInvalidError();
    }

    // 4. Check if token is expired
    if (matchedToken.expiresAt < new Date()) {
      await prisma.verificationToken.update({
        where: { id: matchedToken.id },
        data: { usedAt: new Date() },
      });
      throw new AuthPasswordResetExpiredError();
    }

    // 5. Mark token as used
    await prisma.verificationToken.update({
      where: { id: matchedToken.id },
      data: { usedAt: new Date() },
    });

    // 6. Find the user and update password
    const userId = matchedToken.userId;
    if (!userId) {
      throw new AuthPasswordResetInvalidError();
    }

    const hashedPassword = await hashPassword(password);

    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    // 7. Revoke ALL user sessions — force re-login on all devices
    await revokeAllUserSessions(userId);

    // 8. Log auth event
    await logAuthEvent("PASSWORD_RESET_COMPLETED", request, {
      userId,
      identifier: matchedToken.identifier,
    });

    return {
      message:
        "Password reset successfully. Please login with your new password.",
    };
  },
  successMessage:
    "Password reset successfully. Please login with your new password.",
});
