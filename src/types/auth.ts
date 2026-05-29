/**
 * Purpose: Auth domain types
 * Responsibility: Types matching User, AuthSession, AuthOtp, AuthEvent Prisma models
 *                + Auth state and response types for frontend
 */

import type { UserRole, AuthOtpPurpose, AuthEventType } from "./enums";

// ==================== Database Models ====================

export interface User {
  id: string;
  mobile: string;
  name: string | null;
  email: string | null;
  role: UserRole;
  branchId: string | null;
  avatarUrl: string | null;
  loyaltyPoints: number;
  isActive: boolean;
  createdAt: Date;
  lastLoginAt: Date | null;
  updatedAt: Date;
}

export interface AuthSession {
  id: string;
  userId: string;
  token: string;
  device: string | null;
  ip: string | null;
  expiresAt: Date;
  createdAt: Date;
}

export interface AuthOtp {
  id: string;
  mobile: string;
  otp: string;
  purpose: AuthOtpPurpose;
  attempts: number;
  isUsed: boolean;
  expiresAt: Date;
  createdAt: Date;
}

export interface AuthEvent {
  id: string;
  userId: string | null;
  mobile: string;
  event: AuthEventType;
  ip: string | null;
  device: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
}

// ==================== Frontend State ====================

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// ==================== API Response Types ====================

/** User profile returned in auth responses (no sensitive fields) */
export interface UserProfile {
  id: string;
  mobile: string;
  name: string | null;
  email: string | null;
  role: UserRole;
  avatarUrl: string | null;
  loyaltyPoints: number;
}

/** JWT token pair returned after login/refresh */
export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

/** Response from verify-otp endpoint */
export interface OTPVerifyResponse {
  user: UserProfile;
  tokens: TokenPair;
  isNewUser: boolean;
}

/** Response from send-otp endpoint */
export interface SendOtpResponse {
  mobile: string;
  expiresIn: number;
  messageId: string | null;
}

/** Response from refresh endpoint */
export interface RefreshTokenResponse {
  tokens: TokenPair;
}

/** Response from logout endpoint */
export interface LogoutResponse {
  sessionId: string;
}

/** JWT payload structure */
export interface JwtPayload {
  userId: string;
  mobile: string;
  role: string;
  sessionId: string;
  iat: number;
  exp: number;
  iss: string;
  aud: string;
}
