/**
 * Purpose: Shared auth types — used across server and client
 * Responsibility: Type definitions for the auth system
 * Important Notes:
 *   - Keep server-only types in src/lib/server/types.ts
 *   - This file is safe to import in client components
 */

import type { UserRole, AuthProvider } from "./enums";

// ==================== USER ====================

/** User profile returned in API responses — NEVER expose password or tokens */
export interface AuthUser {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  avatarUrl: string | null;
  emailVerified: boolean;
  phoneVerified: boolean;
  role: UserRole;
  branchId: string | null;
  loyaltyPoints: number;
  providers: AuthProvider[];
}

// ==================== TOKENS ====================

/** JWT access token payload — embedded in the JWT */
export interface AccessTokenPayload {
  userId: string;
  role: UserRole;
  sessionId: string;
}

/** JWT refresh token payload */
export interface RefreshTokenPayload {
  userId: string;
  sessionId: string;
  /** Token family — for reuse detection */
  family: string;
}

/** Token pair returned after login/refresh */
export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

// ==================== AUTH RESPONSE ====================

/** Standard auth response — returned by all login/register endpoints */
export interface AuthResponse {
  user: AuthUser;
  tokens: TokenPair;
  isNewUser: boolean;
}

// ==================== DEVICE ====================

/** Device info parsed from User-Agent */
export interface DeviceInfo {
  deviceName: string | null;
  deviceType: "mobile" | "desktop" | "tablet" | "unknown";
  browser: string | null;
  os: string | null;
  userAgent: string;
}

/** Session with device info — for device management UI */
export interface SessionDevice {
  id: string;
  deviceName: string | null;
  deviceType: string | null;
  browser: string | null;
  os: string | null;
  ip: string | null;
  country: string | null;
  city: string | null;
  lastActiveAt: string;
  createdAt: string;
  isCurrent: boolean;
}

// ==================== VERIFICATION ====================

export type VerificationType =
  | "PHONE_OTP"
  | "EMAIL_OTP"
  | "EMAIL_MAGIC_LINK"
  | "PASSWORD_RESET";

// ==================== AUTH STATE (FRONTEND) ====================

export interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}
