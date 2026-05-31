/**
 * Purpose: Change password API endpoint
 * Responsibility: Allow authenticated user to change their own password
 *
 * Endpoint:
 *   PATCH /api/users/me/password   — Change own password (authenticated user)
 *
 * Request Body:
 *   currentPassword (required) — User's current password
 *   newPassword (required) — New password (min 8 chars, 1 uppercase, 1 lowercase, 1 digit)
 *
 * Responses:
 *   200: { success: true, data: null, message: "Password changed successfully" }
 *   400: { success: false, error, message } — validation error
 *   401: { success: false, error: "AUTH_*" } — not authenticated or wrong current password
 *
 * Important Notes:
 *   - Uses bcryptjs to verify current password and hash new one
 *   - Only works for users who have a password set (EMAIL auth provider)
 *   - Google/Mobile-only users cannot change password (no existing password)
 */

import bcrypt from "bcryptjs";
import { createApiHandler } from "@/lib/api-handler";
import { prisma } from "@/lib/prisma";
import { requireActiveUser } from "@/lib/auth-helpers";
import { ValidationError, ForbiddenError } from "@/lib/errors";
import { changePasswordSchema } from "@/lib/validations/users";

const PASSWORD_SALT_ROUNDS = 12;

// ==================== PATCH — Change Password ====================

export const PATCH = createApiHandler({
  schema: changePasswordSchema,
  successMessage: "Password changed successfully",
  handler: async ({ parsedBody, request }) => {
    const { currentPassword, newPassword } = parsedBody;

    // 1. Require authenticated user with full password field
    const { user } = await requireActiveUser(request);

    // 2. Fetch user with password field (not included by default in requireActiveUser)
    const fullUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        password: true,
        authProvider: true,
      },
    });

    if (!fullUser) {
      throw new ForbiddenError("User not found");
    }

    // 3. Check user has a password set (EMAIL auth provider)
    if (!fullUser.password) {
      throw new ValidationError(
        "Cannot change password for accounts without a password. Please set a password first."
      );
    }

    // 4. Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(
      currentPassword,
      fullUser.password
    );
    if (!isCurrentPasswordValid) {
      throw new ValidationError("Current password is incorrect");
    }

    // 5. Hash new password
    const hashedNewPassword = await bcrypt.hash(newPassword, PASSWORD_SALT_ROUNDS);

    // 6. Update password in database
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedNewPassword },
    });

    return null;
  },
});
