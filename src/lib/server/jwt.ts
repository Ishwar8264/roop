/**
 * Purpose: JWT token management — sign, verify, decode
 * Responsibility: All JWT operations using jose (Edge Runtime compatible)
 * Important Notes:
 *   - Uses jose library — works in Edge Runtime + Node.js
 *   - HS256 algorithm — symmetric, fast, single-server
 *   - Access token: 15 min (short-lived, used in API calls)
 *   - Refresh token: 30 days (long-lived, stored in HttpOnly cookie)
 *   - Refresh tokens include a "family" for reuse detection
 *   - JWT secrets validated at startup — no hardcoded fallbacks
 */

import { SignJWT, jwtVerify } from "jose";
import type { UserRole } from "@/shared/types/enums";
import { JWT_CONFIG } from "@/lib/config/auth";
import type { AccessTokenPayload, RefreshTokenPayload } from "@/shared/types/auth";

// ==================== SECRETS ====================
// Validated at startup by config/auth.ts — no fallbacks

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET!);
const JWT_REFRESH_SECRET = new TextEncoder().encode(process.env.JWT_REFRESH_SECRET!);

// ==================== ACCESS TOKEN ====================

/**
 * Sign a new access token (15 min expiry)
 * Contains: userId, role, sessionId — minimal payload for performance
 */
export async function signAccessToken(payload: AccessTokenPayload): Promise<string> {
  return new SignJWT({
    userId: payload.userId,
    role: payload.role,
    sessionId: payload.sessionId,
  })
    .setProtectedHeader({ alg: JWT_CONFIG.ALGORITHM })
    .setIssuedAt()
    .setIssuer(JWT_CONFIG.ISSUER)
    .setAudience(JWT_CONFIG.ACCESS_AUDIENCE)
    .setExpirationTime(JWT_CONFIG.ACCESS_TOKEN_EXPIRY)
    .setSubject(payload.userId)
    .sign(JWT_SECRET);
}

/**
 * Verify an access token
 * Returns payload if valid, null if expired/invalid
 */
export async function verifyAccessToken(
  token: string
): Promise<AccessTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET, {
      issuer: JWT_CONFIG.ISSUER,
      audience: JWT_CONFIG.ACCESS_AUDIENCE,
    });

    return {
      userId: payload.userId as string,
      role: payload.role as UserRole,
      sessionId: payload.sessionId as string,
    };
  } catch {
    return null;
  }
}

// ==================== REFRESH TOKEN ====================

/**
 * Sign a new refresh token (30 days expiry)
 * Contains: userId, sessionId, family (for reuse detection)
 * The "family" links all refresh tokens in a rotation chain
 */
export async function signRefreshToken(
  payload: RefreshTokenPayload
): Promise<string> {
  return new SignJWT({
    userId: payload.userId,
    sessionId: payload.sessionId,
    family: payload.family,
  })
    .setProtectedHeader({ alg: JWT_CONFIG.ALGORITHM })
    .setIssuedAt()
    .setIssuer(JWT_CONFIG.ISSUER)
    .setAudience(JWT_CONFIG.REFRESH_AUDIENCE)
    .setExpirationTime(JWT_CONFIG.REFRESH_TOKEN_EXPIRY)
    .setSubject(payload.userId)
    .sign(JWT_REFRESH_SECRET);
}

/**
 * Verify a refresh token
 * Returns payload if valid, null if expired/invalid
 */
export async function verifyRefreshToken(
  token: string
): Promise<RefreshTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_REFRESH_SECRET, {
      issuer: JWT_CONFIG.ISSUER,
      audience: JWT_CONFIG.REFRESH_AUDIENCE,
    });

    return {
      userId: payload.userId as string,
      sessionId: payload.sessionId as string,
      family: payload.family as string,
    };
  } catch {
    return null;
  }
}

// ==================== TOKEN PAIR ====================

/**
 * Generate both access + refresh token pair
 * Called after successful authentication or token refresh
 */
export async function generateTokenPair(
  accessPayload: AccessTokenPayload,
  family: string
): Promise<{ accessToken: string; refreshToken: string }> {
  const [accessToken, refreshToken] = await Promise.all([
    signAccessToken(accessPayload),
    signRefreshToken({
      userId: accessPayload.userId,
      sessionId: accessPayload.sessionId,
      family,
    }),
  ]);

  return { accessToken, refreshToken };
}
