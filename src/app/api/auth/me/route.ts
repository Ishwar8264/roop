/**
 * Purpose: Get current authenticated user API endpoint
 * Responsibility: Return current user profile based on JWT token
 * Important Notes:
 *   - GET /api/auth/me
 *   - Requires Authorization header: Bearer <accessToken>
 *   - Returns full user profile (without sensitive data)
 *   - Used by frontend to check auth state on page load
 *   - If token invalid/expired → 401 (frontend should redirect to login)
 */

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAccessToken } from "@/lib/jwt";
import {
  apiSuccess,
  apiUnauthorized,
  apiNotFound,
  apiServerError,
} from "@/lib/api-response";

export async function GET(request: NextRequest) {
  try {
    // 1. Extract token from Authorization header
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return apiUnauthorized("Missing or invalid authorization header");
    }

    const token = authHeader.split(" ")[1];

    // 2. Verify access token
    const payload = await verifyAccessToken(token);
    if (!payload) {
      return apiUnauthorized("Invalid or expired token");
    }

    // 3. Verify session still exists (not logged out)
    const session = await prisma.authSession.findUnique({
      where: { id: payload.sessionId },
    });

    if (!session) {
      return apiUnauthorized("Session has been invalidated. Please login again.");
    }

    // 4. Fetch user from database (ensure data is fresh)
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
        // Never return: updatedAt (internal), password fields (none currently)
      },
    });

    if (!user) {
      return apiNotFound("User not found");
    }

    // 5. Check if user is still active
    if (!user.isActive) {
      return apiUnauthorized("Your account has been suspended.");
    }

    // 6. Return user profile
    return apiSuccess({
      user,
    });
  } catch (error) {
    console.error("[ME_ERROR]", error);
    return apiServerError("Failed to fetch user profile.");
  }
}
