/**
 * Purpose: Change password for logged-in users
 * Endpoint: POST /api/auth/change-password
 *
 * Flow:
 *   1. Require auth (requireAuthWithSession)
 *   2. Validate with changePasswordSchema (currentPassword + newPassword)
 *   3. Find user, verify current password
 *   4. If wrong → throw AuthWrongPasswordError
 *   5. Hash new password, update user
 *   6. Revoke all OTHER sessions (keep current session alive)
 *   7. Log PASSWORD_CHANGED auth event
 */

import { createApiHandler } from "@/lib/server/api-handler";
import { prisma } from "@/lib/database/prisma";
import {
  requireAuthWithSession,
  revokeAllUserSessions,
  revokeSession,
} from "@/features/auth/services/session-service";
import { verifyPasswordHash, hashPassword } from "@/lib/server/crypto";
import { logAuthEvent } from "@/features/auth/services/auth-event-service";
import { changePasswordSchema } from "@/features/user/validations/user";
import { AuthWrongPasswordError } from "@/lib/server/errors";
import type { ChangePasswordInput } from "@/features/user/validations/user";

export const POST = createApiHandler<ChangePasswordInput, { message: string }>({
  schema: changePasswordSchema,
  handler: async ({ parsedBody, request }) => {
    // 1. Require authenticated user with valid session
    const { payload, user } = await requireAuthWithSession(request);

    const { currentPassword, newPassword } = parsedBody;

    // 2. Find user with password hash
    const fullUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { id: true, password: true, email: true },
    });

    if (!fullUser || !fullUser.password) {
      throw new AuthWrongPasswordError();
    }

    // 3. Verify current password
    const isCurrentPasswordValid = await verifyPasswordHash(
      currentPassword,
      fullUser.password
    );

    if (!isCurrentPasswordValid) {
      throw new AuthWrongPasswordError();
    }

    // 4. Hash new password, then update + fetch other sessions (parallel — independent)
    const hashedNewPassword = await hashPassword(newPassword);

    const [, otherSessions] = await Promise.all([
      prisma.user.update({
        where: { id: user.id },
        data: { password: hashedNewPassword },
      }),
      prisma.session.findMany({
        where: {
          userId: user.id,
          NOT: { id: payload.sessionId },
        },
        select: { id: true },
      }),
    ]);

    // 5. Revoke all OTHER sessions — keep current session alive
    await Promise.all(
      otherSessions.map((session) => revokeSession(session.id, user.id))
    );

    // 6. Log auth event
    await logAuthEvent("PASSWORD_CHANGED", request, {
      userId: user.id,
      identifier: fullUser.email || undefined,
    });

    return { message: "Password changed successfully." };
  },
  successMessage: "Password changed successfully.",
});
