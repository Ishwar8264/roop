/**
 * Purpose: Get current authenticated user API endpoint
 * Responsibility: Return current user profile based on JWT token
 * Important Notes:
 *   - GET /api/auth/me
 *   - Requires Authorization header: Bearer <accessToken>
 *   - Uses createApiHandler with schema: null (no body)
 */

import { createApiHandler } from "@/lib/api-handler";
import { prisma } from "@/lib/prisma";
import { verifyAccessToken } from "@/lib/jwt";
import {
  AuthMissingTokenError,
  AuthInvalidTokenError,
  AuthSessionInvalidError,
  AuthAccountSuspendedError,
  NotFoundError,
} from "@/lib/errors";

export const GET = createApiHandler({
  schema: null, // No body — token from Authorization header
  handler: async ({ request }) => {
    // 1. Extract token from Authorization header
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      throw new AuthMissingTokenError();
    }

    const token = authHeader.split(" ")[1];

    // 2. Verify access token
    const payload = await verifyAccessToken(token);
    if (!payload) {
      throw new AuthInvalidTokenError();
    }

    // 3. Verify session still exists (not logged out)
    const session = await prisma.authSession.findUnique({
      where: { id: payload.sessionId },
    });

    if (!session) {
      throw new AuthSessionInvalidError();
    }

    // 4. Fetch user from database
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        mobile: true,
        name: true,
        email: true,
        role: true,
        branchId: true,
        avatarUrl: true,
        loyaltyPoints: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new NotFoundError("User not found");
    }

    // 5. Check if user is still active
    if (!user.isActive) {
      throw new AuthAccountSuspendedError();
    }

    return { user };
  },
});
