/**
 * Purpose: Shared helper for creating auth sessions and returning token responses
 * Responsibility: DRY — same session+token logic used by verify-otp, register-email, login-email, google
 * Important Notes:
 *   - Creates AuthSession in DB
 *   - Generates JWT access + refresh token pair
 *   - Stores token hash in session
 *   - Updates user's lastLoginAt
 *   - Returns standardized auth response
 */

import { NextRequest } from "next/server";
import { prisma } from "./prisma";
import { generateTokenPair } from "./jwt";
import { hashTokenSha256 } from "./crypto";
import type { UserRole, AuthProvider } from "@prisma/client";

// ==================== TYPES ====================

interface UserForAuth {
  id: string;
  mobile: string | null;
  email: string | null;
  name: string | null;
  role: UserRole;
  authProvider: AuthProvider;
  avatarUrl: string | null;
  loyaltyPoints: number;
  isActive: boolean;
}

// ==================== HELPER ====================

/**
 * Create a new auth session and return tokens + user data
 * Used by all login/register endpoints (OTP, email, Google)
 *
 * @param user - The user record from DB
 * @param request - Next.js request (for device/IP info)
 * @returns Token pair + user profile data
 */
export async function createAuthSessionAndTokens(
  user: UserForAuth,
  request: NextRequest
) {
  // 1. Create auth session
  const session = await prisma.authSession.create({
    data: {
      userId: user.id,
      token: "placeholder", // Will update after token generation
      device: request.headers.get("user-agent") || null,
      ip:
        request.headers.get("x-forwarded-for") ||
        request.headers.get("x-real-ip") ||
        null,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    },
  });

  // 2. Generate JWT token pair
  const tokens = await generateTokenPair({
    userId: user.id,
    mobile: user.mobile,
    email: user.email,
    role: user.role,
    sessionId: session.id,
  });

  // 3. Update session with token hash
  const tokenHash = await hashTokenSha256(tokens.accessToken);
  await prisma.authSession.update({
    where: { id: session.id },
    data: { token: tokenHash },
  });

  // 4. Update user's lastLoginAt
  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  // 5. Return standardized response
  return {
    user: {
      id: user.id,
      mobile: user.mobile,
      name: user.name,
      email: user.email,
      role: user.role,
      authProvider: user.authProvider,
      avatarUrl: user.avatarUrl,
      loyaltyPoints: user.loyaltyPoints,
    },
    tokens: {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    },
  };
}
