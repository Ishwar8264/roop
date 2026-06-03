/**
 * Purpose: Auth configuration constants — single source of truth
 * Responsibility: Centralize all auth-related config values
 * Important Notes:
 *   - Never hardcode auth values anywhere else
 *   - All timeouts in seconds, all token expiries in human-readable format
 *   - JWT secrets are validated at startup — app CRASHES if missing
 */

// ==================== JWT CONFIG ====================

export const JWT_CONFIG = {
  /** Access token expiry — short-lived for security */
  ACCESS_TOKEN_EXPIRY: "15m",

  /** Refresh token expiry — long-lived for convenience */
  REFRESH_TOKEN_EXPIRY: "30d",

  /** JWT issuer claim — identifies this application */
  ISSUER: "nikharta-roop",

  /** JWT audience — scope the token to our API */
  ACCESS_AUDIENCE: "nikharta-roop-api",
  REFRESH_AUDIENCE: "nikharta-roop-refresh",

  /** Algorithm — HS256 for symmetric, fast, single-server */
  ALGORITHM: "HS256",
} as const;

// ==================== OTP CONFIG ====================

export const OTP_CONFIG = {
  /** OTP length — 6 digits */
  LENGTH: 6,

  /** OTP expiry in seconds — 5 minutes (Indian SMS can be slow) */
  EXPIRY_SECONDS: 300,

  /** Max verification attempts before OTP is invalidated */
  MAX_ATTEMPTS: 5,

  /** Resend cooldown in seconds — wait before requesting new OTP */
  RESEND_COOLDOWN_SECONDS: 60,

  /** Max OTPs per phone per hour */
  HOURLY_LIMIT: 5,

  /** Max OTPs per phone per day */
  DAILY_LIMIT: 10,

  /** Max OTPs per IP per hour (prevents spam from one IP) */
  IP_HOURLY_LIMIT: 20,
} as const;

// ==================== RATE LIMIT CONFIG ====================

export const RATE_LIMIT_CONFIG = {
  /** Login attempts per email/phone before lockout */
  LOGIN_MAX_ATTEMPTS: 5,

  /** Login lockout duration in seconds */
  LOGIN_LOCKOUT_SECONDS: 900, // 15 minutes

  /** Max sessions per user */
  MAX_SESSIONS_PER_USER: 5,
} as const;

// ==================== SESSION CONFIG ====================

export const SESSION_CONFIG = {
  /** Refresh token expiry in days */
  REFRESH_TOKEN_DAYS: 30,

  /** Max concurrent sessions per user */
  MAX_DEVICES: 5,

  /** Cookie name for refresh token */
  REFRESH_TOKEN_COOKIE: "nr_refresh_token",

  /** Cookie name for access token (short-lived backup for page route auth) */
  ACCESS_TOKEN_COOKIE: "nr_access_token",

  /** Access token cookie expiry in seconds — 15 minutes (matches JWT expiry) */
  ACCESS_TOKEN_COOKIE_MAX_AGE: 15 * 60,

  /** Cookie path — "/" so proxy.ts can read it on ALL routes (pages + API) */
  COOKIE_PATH: "/",

  /** Cookie same-site policy — "lax" for broad browser compatibility (still blocks CSRF on sub-requests) */
  COOKIE_SAME_SITE: "lax" as const,

  /** Whether cookie is HTTP only — ALWAYS true in production */
  COOKIE_HTTP_ONLY: true,

  /** Whether cookie requires HTTPS — true in production */
  COOKIE_SECURE: process.env.NODE_ENV === "production",
} as const;

// ==================== MAGIC LINK CONFIG ====================

export const MAGIC_LINK_CONFIG = {
  /** Magic link expiry in seconds — 10 minutes */
  EXPIRY_SECONDS: 600,

  /** Magic link base path */
  CALLBACK_PATH: "/api/auth/verify-magic-link",
} as const;

// ==================== REDIS KEY PREFIXES ====================

export const REDIS_KEYS = {
  /** OTP storage: `otp:phone:{phone}` → { token, attempts, createdAt } */
  OTP_PREFIX: "otp:phone:",

  /** OTP rate limit: `otp:rate:{phone}` → count */
  OTP_RATE_PREFIX: "otp:rate:",

  /** OTP IP rate limit: `otp:ip:{ip}` → count */
  OTP_IP_RATE_PREFIX: "otp:ip:",

  /** Login rate limit: `login:rate:{identifier}` → { count, lockedUntil } */
  LOGIN_RATE_PREFIX: "login:rate:",

  /** Refresh token family: `refresh:family:{sessionId}` → [tokenHash, ...] */
  REFRESH_FAMILY_PREFIX: "refresh:family:",

  /** Suspicious activity: `suspicious:{userId}` → count */
  SUSPICIOUS_PREFIX: "suspicious:",
} as const;

// ==================== STARTUP VALIDATION ====================

/**
 * Validate that required environment variables are set
 * App should CRASH on startup if secrets are missing — never fall back to hardcoded values
 */
export function validateAuthConfig(): void {
  const required = ["JWT_SECRET", "JWT_REFRESH_SECRET", "DATABASE_URL"];

  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(
      `[FATAL] Missing required environment variables: ${missing.join(", ")}. ` +
      `Auth system cannot start without these. Check your .env file.`
    );
  }

  // Validate secret lengths — short secrets are insecure
  const JWT_SECRET = process.env.JWT_SECRET!;
  const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET!;

  if (JWT_SECRET.length < 32) {
    throw new Error(
      `[FATAL] JWT_SECRET must be at least 32 characters. Current: ${JWT_SECRET.length}. ` +
      `Generate with: openssl rand -base64 48`
    );
  }

  if (JWT_REFRESH_SECRET.length < 32) {
    throw new Error(
      `[FATAL] JWT_REFRESH_SECRET must be at least 32 characters. Current: ${JWT_REFRESH_SECRET.length}. ` +
      `Generate with: openssl rand -base64 48`
    );
  }
}

// Run validation on import — but only at runtime (not during build)
// During `next build`, env vars may not be available but that's fine —
// validation will run when the app actually starts
if (process.env.NODE_ENV !== undefined && process.env.NEXT_PHASE !== 'phase-production-build') {
  validateAuthConfig();
}
