/**
 * Purpose: Shared helper for creating auth sessions and returning token responses
 * Responsibility: DRY — same session+token logic used by verify-otp, register-email, login-email, google
 * Important Notes:
 *   - Creates Session in DB (with device info, refresh token hash)
 *   - Generates JWT access + refresh token pair using the new jwt module
 *   - Stores refresh token hash in session (for rotation + reuse detection)
 *   - Updates user's lastLoginAt
 *   - Returns standardized auth response
 */

import { NextRequest } from "next/server";
import { prisma } from "@/lib/database/prisma";
import { generateTokenPair } from "@/lib/server/jwt";
import { hashTokenSha256, generateTokenFamily } from "@/lib/server/crypto";
import { SESSION_CONFIG, REDIS_KEYS } from "@/lib/config/auth";
import { redis } from "@/lib/config/redis";
import { parseUserAgent, extractClientIp, extractGeoFromIp } from "@/lib/server/device";

// ==================== TYPES ====================

interface UserForAuth {
  id: string;
  mobile: string | null;
  email: string | null;
  name: string | null;
  role: string;
  authProvider: string;
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
  // 1. Parse device info
  const ua = request.headers.get("user-agent") || "";
  const device = parseUserAgent(ua);
  const ip = extractClientIp(request);
  const geo = extractGeoFromIp(ip);

  // 2. Generate token family (for reuse detection)
  const family = generateTokenFamily();

  // 3. Create session with placeholder refresh token hash
  const session = await prisma.session.create({
    data: {
      userId: user.id,
      refreshTokenHash: "placeholder",
      deviceName: device.deviceName,
      deviceType: device.deviceType,
      browser: device.browser,
      os: device.os,
      ip,
      country: geo.country,
      city: geo.city,
      userAgent: ua,
      lastActiveAt: new Date(),
      expiresAt: new Date(
        Date.now() + SESSION_CONFIG.REFRESH_TOKEN_DAYS * 24 * 60 * 60 * 1000
      ),
    },
  });

  // 4. Generate JWT token pair
  const tokens = await generateTokenPair(
    {
      userId: user.id,
      role: user.role as "USER" | "STAFF" | "ADMIN",
      sessionId: session.id,
    },
    family
  );

  // 5. Update session with refresh token hash
  const refreshTokenHash = await hashTokenSha256(tokens.refreshToken);
  await prisma.session.update({
    where: { id: session.id },
    data: { refreshTokenHash },
  });

  // 6. Store token family in Redis for reuse detection
  await redis.set(
    `${REDIS_KEYS.REFRESH_FAMILY_PREFIX}${session.id}`,
    JSON.stringify({ family, tokens: [refreshTokenHash] }),
    "EX",
    SESSION_CONFIG.REFRESH_TOKEN_DAYS * 24 * 60 * 60
  );

  // 7. Update user's lastLoginAt
  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  // 8. Return standardized response
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
