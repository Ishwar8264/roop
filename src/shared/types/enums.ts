/**
 * Purpose: Shared enum types — mirrors Prisma enums for client use
 * Responsibility: Type-safe enum definitions usable in both server and client
 * Important Notes:
 *   - These MUST stay in sync with prisma/schema-auth.prisma
 *   - Import from here instead of @prisma/client in client code
 */

export type UserRole = "GUEST" | "USER" | "STAFF" | "ADMIN";

export type AuthProvider = "MOBILE" | "EMAIL" | "GOOGLE";

export type VerificationType =
  | "PHONE_OTP"
  | "EMAIL_OTP"
  | "EMAIL_MAGIC_LINK"
  | "PASSWORD_RESET";

export type AuthEventType =
  | "LOGIN_SUCCESS"
  | "LOGIN_FAILED"
  | "OTP_SENT"
  | "OTP_VERIFIED"
  | "LOGOUT"
  | "TOKEN_REFRESHED"
  | "REGISTER_EMAIL"
  | "REGISTER_GOOGLE"
  | "REGISTER_PHONE"
  | "MAGIC_LINK_SENT"
  | "MAGIC_LINK_VERIFIED"
  | "PASSWORD_RESET_REQUESTED"
  | "PASSWORD_RESET_COMPLETED"
  | "ACCOUNT_LINKED"
  | "PASSWORD_CHANGED"
  | "ACCOUNT_DEACTIVATED"
  | "DEVICE_REVOKED"
  | "SUSPICIOUS_LOGIN";

export type DeviceType = "mobile" | "desktop" | "tablet" | "unknown";

/** Human-readable auth provider names */
const _AUTH_PROVIDER_LABELS: Record<AuthProvider, string> = {
  MOBILE: "Phone OTP",
  EMAIL: "Email",
  GOOGLE: "Google",
};

/** Human-readable role names (Hindi-first) */
const _USER_ROLE_LABELS: Record<UserRole, { hi: string; en: string }> = {
  GUEST: { hi: "अतिथि", en: "Guest" },
  USER: { hi: "ग्राहक", en: "Customer" },
  STAFF: { hi: "स्टाफ", en: "Staff" },
  ADMIN: { hi: "व्यवस्थापक", en: "Admin" },
};
