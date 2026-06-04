/**
 * Purpose: Auth domain types
 * Responsibility: Types matching User, AuthSession, AuthOtp, AuthEvent Prisma models
 *                + Auth state and response types for frontend
 */

import type { UserRole, AuthOtpPurpose, AuthEventType, AuthProvider } from "./enums";

// ==================== Database Models ====================

export interface User {
  id: string;
  mobile: string | null;
  name: string | null;
  email: string | null;
  emailVerified: boolean;
  password: string | null;
  googleId: string | null;
  authProvider: AuthProvider;
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
  userId: string | null;
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
  mobile: string | null;
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
  mobile: string | null;
  name: string | null;
  email: string | null;
  emailVerified?: boolean;
  role: UserRole;
  avatarUrl: string | null;
  loyaltyPoints: number;
  authProvider: AuthProvider;
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
  /** Dev-only: OTP returned for testing (not in production) */
  devOtp?: string;
}

/** Response from register-email endpoint */
export interface RegisterEmailResponse {
  user: UserProfile;
  tokens: TokenPair;
}

/** Response from login-email endpoint */
export interface LoginEmailResponse {
  user: UserProfile;
  tokens: TokenPair;
}

/** Response from google auth endpoint */
export interface GoogleAuthResponse {
  user: UserProfile;
  tokens: TokenPair;
  isNewUser: boolean;
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
  mobile: string | null;
  email: string | null;
  role: string;
  sessionId: string;
  iat: number;
  exp: number;
  iss: string;
  aud: string;
}
