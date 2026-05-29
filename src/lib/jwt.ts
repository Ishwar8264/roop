/**
 * Purpose: JWT token management for Nikharta Roop auth system
 * Responsibility: Sign, verify, and refresh JWT tokens using jose (edge-compatible)
 * Important Notes:
 *   - Uses jose library (not jsonwebtoken) — works in Edge Runtime + Node.js
 *   - HS256 algorithm — symmetric, fast, single-server setup
 *   - Access token: 15 min expiry (short-lived, used in API calls)
 *   - Refresh token: 7 days expiry (long-lived, used to get new access token)
 *   - Tokens stored in AuthSession model for logout/invalidation
 *   - JWT_SECRET must be set in .env (at least 32 chars)
 */

import { SignJWT, jwtVerify } from "jose";
import type { UserRole } from "@prisma/client";

// ==================== CONFIG ====================

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "nikharta-roop-jwt-secret-change-in-production-min-32-chars"
);

const ACCESS_TOKEN_EXPIRY = "15m"; // Short-lived — 15 minutes
const REFRESH_TOKEN_EXPIRY = "7d"; // Long-lived — 7 days

// ==================== TYPES ====================

export interface TokenPayload {
  userId: string;
  mobile: string;
  role: UserRole;
  sessionId: string;
}

export interface VerifiedToken {
  payload: TokenPayload;
  expired: false;
}

export interface ExpiredToken {
  payload: null;
  expired: true;
}

// ==================== TOKEN OPERATIONS ====================

/**
 * Sign a new access token (15 min expiry)
 * Used after OTP verification or token refresh
 */
export async function signAccessToken(payload: TokenPayload): Promise<string> {
  return new SignJWT({
    userId: payload.userId,
    mobile: payload.mobile,
    role: payload.role,
    sessionId: payload.sessionId,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setIssuer("nikharta-roop")
    .setAudience("nikharta-roop-api")
    .setExpirationTime(ACCESS_TOKEN_EXPIRY)
    .setSubject(payload.userId)
    .sign(JWT_SECRET);
}

/**
 * Sign a new refresh token (7 days expiry)
 * Used to get new access tokens without re-login
 */
export async function signRefreshToken(payload: TokenPayload): Promise<string> {
  return new SignJWT({
    userId: payload.userId,
    mobile: payload.mobile,
    role: payload.role,
    sessionId: payload.sessionId,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setIssuer("nikharta-roop")
    .setAudience("nikharta-roop-refresh")
    .setExpirationTime(REFRESH_TOKEN_EXPIRY)
    .setSubject(payload.userId)
    .sign(JWT_SECRET);
}

/**
 * Verify an access token
 * Returns payload if valid, null if expired/invalid
 */
export async function verifyAccessToken(
  token: string
): Promise<TokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET, {
      issuer: "nikharta-roop",
      audience: "nikharta-roop-api",
    });

    return {
      userId: payload.userId as string,
      mobile: payload.mobile as string,
      role: payload.role as UserRole,
      sessionId: payload.sessionId as string,
    };
  } catch {
    // Token expired, malformed, or invalid signature
    return null;
  }
}

/**
 * Verify a refresh token
 * Returns payload if valid, null if expired/invalid
 */
export async function verifyRefreshToken(
  token: string
): Promise<TokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET, {
      issuer: "nikharta-roop",
      audience: "nikharta-roop-refresh",
    });

    return {
      userId: payload.userId as string,
      mobile: payload.mobile as string,
      role: payload.role as UserRole,
      sessionId: payload.sessionId as string,
    };
  } catch {
    return null;
  }
}

/**
 * Generate both access + refresh token pair
 * Call this after successful OTP verification or refresh
 */
export async function generateTokenPair(
  payload: TokenPayload
): Promise<{ accessToken: string; refreshToken: string }> {
  const [accessToken, refreshToken] = await Promise.all([
    signAccessToken(payload),
    signRefreshToken(payload),
  ]);

  return { accessToken, refreshToken };
}
