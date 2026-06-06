/**
 * Purpose: Centralized HTTP status codes, messages, and error definitions
 * Responsibility: Single source of truth for all HTTP responses across the platform
 * Important Notes:
 *   - Every API route MUST use these constants — never hardcode status codes or messages
 *   - Messages support i18n pattern: messageHi + messageEn
 *   - Adding a new error? Add it here first, then use in route handler
 *   - This ensures consistency and makes future i18n migration trivial
 */

// ==================== HTTP STATUS CODES ====================

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE: 422,
  RATE_LIMITED: 429,
  INTERNAL_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
} as const;

// ==================== ERROR CODES ====================
// Machine-readable error codes — used by frontend for conditional logic

export const ERROR_CODES = {
  // Auth errors (AUTH_*)
  AUTH_MISSING_TOKEN: "AUTH_MISSING_TOKEN",
  AUTH_INVALID_TOKEN: "AUTH_INVALID_TOKEN",
  AUTH_EXPIRED_TOKEN: "AUTH_EXPIRED_TOKEN",
  AUTH_SESSION_INVALID: "AUTH_SESSION_INVALID",
  AUTH_ACCOUNT_SUSPENDED: "AUTH_ACCOUNT_SUSPENDED",
  AUTH_OTP_INVALID: "AUTH_OTP_INVALID",
  AUTH_OTP_EXPIRED: "AUTH_OTP_EXPIRED",
  AUTH_OTP_MAX_ATTEMPTS: "AUTH_OTP_MAX_ATTEMPTS",
  AUTH_OTP_ALREADY_SENT: "AUTH_OTP_ALREADY_SENT",
  AUTH_RATE_LIMITED: "AUTH_RATE_LIMITED",
  AUTH_HOURLY_LIMIT: "AUTH_HOURLY_LIMIT",
  AUTH_EMAIL_EXISTS: "AUTH_EMAIL_EXISTS",
  AUTH_MOBILE_EXISTS: "AUTH_MOBILE_EXISTS",
  AUTH_USERNAME_EXISTS: "AUTH_USERNAME_EXISTS",
  AUTH_MOBILE_NOT_REGISTERED: "AUTH_MOBILE_NOT_REGISTERED",
  AUTH_EMAIL_NOT_REGISTERED: "AUTH_EMAIL_NOT_REGISTERED",
  AUTH_INVALID_CREDENTIALS: "AUTH_INVALID_CREDENTIALS",
  AUTH_GOOGLE_TOKEN_INVALID: "AUTH_GOOGLE_TOKEN_INVALID",
  AUTH_EMAIL_NOT_VERIFIED: "AUTH_EMAIL_NOT_VERIFIED",

  // Validation errors (VAL_*)
  VAL_INVALID_INPUT: "VAL_INVALID_INPUT",
  VAL_INVALID_MOBILE: "VAL_INVALID_MOBILE",
  VAL_INVALID_OTP: "VAL_INVALID_OTP",
  VAL_MISSING_FIELD: "VAL_MISSING_FIELD",

  // Resource errors (RES_*)
  RES_NOT_FOUND: "RES_NOT_FOUND",
  RES_ALREADY_EXISTS: "RES_ALREADY_EXISTS",
  RES_CONFLICT: "RES_CONFLICT",

  // Permission errors (PERM_*)
  PERM_ADMIN_REQUIRED: "PERM_ADMIN_REQUIRED",
  PERM_STAFF_REQUIRED: "PERM_STAFF_REQUIRED",
  PERM_DENIED: "PERM_DENIED",

  // System errors (SYS_*)
  SYS_INTERNAL: "SYS_INTERNAL",
  SYS_DATABASE: "SYS_DATABASE",
  SYS_SMS_FAILED: "SYS_SMS_FAILED",
  SYS_SERVICE_DOWN: "SYS_SERVICE_DOWN",
} as const;

// ==================== HTTP MESSAGES ====================
// Human-readable messages — Hindi-first with English fallback
// Structure: { messageHi, messageEn } for future i18n

export interface HttpMessage {
  messageHi: string;
  messageEn: string;
}

export const HTTP_MESSAGES = {
  // ===== Auth Messages =====
  AUTH_MISSING_TOKEN: {
    messageHi: "Authorization token nahi mila. Kripya login karein.",
    messageEn: "Missing authorization token. Please login.",
  },
  AUTH_INVALID_TOKEN: {
    messageHi: "Token invalid hai. Kripya dobara login karein.",
    messageEn: "Invalid token. Please login again.",
  },
  AUTH_EXPIRED_TOKEN: {
    messageHi: "Token ka samay samapt ho gaya. Kripya dobara login karein.",
    messageEn: "Token expired. Please login again.",
  },
  AUTH_SESSION_INVALID: {
    messageHi: "Session invalid ho gaya hai. Kripya dobara login karein.",
    messageEn: "Session has been invalidated. Please login again.",
  },
  AUTH_ACCOUNT_SUSPENDED: {
    messageHi: "Aapka account suspend hai. Support se sampark karein.",
    messageEn: "Your account has been suspended. Please contact support.",
  },
  AUTH_OTP_INVALID: {
    messageHi: "OTP galat hai. Kripya sahi OTP darj karein.",
    messageEn: "Invalid OTP. Please enter the correct OTP.",
  },
  AUTH_OTP_EXPIRED: {
    messageHi: "OTP ka samay samapt ho gaya. Naya OTP bhejein.",
    messageEn: "OTP has expired. Please request a new OTP.",
  },
  AUTH_OTP_MAX_ATTEMPTS: {
    messageHi: "OTP verify karne ki koshishen samapt. Naya OTP bhejein.",
    messageEn: "Maximum verification attempts exceeded. Please request a new OTP.",
  },
  AUTH_OTP_ALREADY_SENT: {
    messageHi: "OTP pehle bheja ja chuka hai. Kripya prateeksha karein.",
    messageEn: "OTP already sent. Please wait before requesting again.",
  },
  AUTH_OTP_SENT_SUCCESS: {
    messageHi: "OTP safaltapoorvak bheja gaya.",
    messageEn: "OTP sent successfully.",
  },
  AUTH_OTP_NO_VALID: {
    messageHi: "Koi valid OTP nahi mila. Naya OTP bhejein.",
    messageEn: "No valid OTP found. Please request a new OTP.",
  },
  AUTH_LOGIN_SUCCESS: {
    messageHi: "Login safaltapoorvak hua!",
    messageEn: "Login successful!",
  },
  AUTH_REGISTER_SUCCESS: {
    messageHi: "Registration safaltapoorvak hui! Nikharta Roop me aapka swagat hai.",
    messageEn: "Registration successful! Welcome to Nikharta Roop.",
  },
  AUTH_LOGOUT_SUCCESS: {
    messageHi: "Logout safaltapoorvak hua.",
    messageEn: "Logged out successfully.",
  },
  AUTH_TOKEN_REFRESHED: {
    messageHi: "Token taza kar diya gaya.",
    messageEn: "Token refreshed successfully.",
  },
  AUTH_RATE_LIMITED: {
    messageHi: "Bahut zyada OTP requests. Kripya baad me prayas karein.",
    messageEn: "Too many OTP requests. Please try again later.",
  },
  AUTH_HOURLY_LIMIT: {
    messageHi: "Ghante ki sima paar. Kripya kuch der baad prayas karein.",
    messageEn: "Hourly limit exceeded. Please try again after some time.",
  },
  AUTH_EMAIL_EXISTS: {
    messageHi: "Yeh email pehle se registered hai. Kripya login karein.",
    messageEn: "This email is already registered. Please login instead.",
  },
  AUTH_MOBILE_EXISTS: {
    messageHi: "Yeh mobile number pehle se registered hai. Kripya login karein.",
    messageEn: "This mobile number is already registered. Please login instead.",
  },
  AUTH_USERNAME_EXISTS: {
    messageHi: "Yeh username pehle se liya hua hai. Kripya doosra choose karein.",
    messageEn: "This username is already taken. Please choose another one.",
  },
  AUTH_MOBILE_NOT_REGISTERED: {
    messageHi: "Yeh mobile number registered nahi hai. Kripya pehle register karein.",
    messageEn: "This mobile number is not registered. Please register first.",
  },
  AUTH_EMAIL_NOT_REGISTERED: {
    messageHi: "Yeh email registered nahi hai. Kripya pehle register karein.",
    messageEn: "This email is not registered. Please register first.",
  },
  AUTH_INVALID_CREDENTIALS: {
    messageHi: "Email ya password galat hai. Kripya dobara prayas karein.",
    messageEn: "Invalid email or password. Please try again.",
  },
  AUTH_GOOGLE_TOKEN_INVALID: {
    messageHi: "Google token invalid hai. Kripya dobara try karein.",
    messageEn: "Invalid Google token. Please try again.",
  },
  AUTH_EMAIL_NOT_VERIFIED: {
    messageHi: "Email verify nahi hua hai. Kripya apna email check karein.",
    messageEn: "Email not verified. Please check your email.",
  },
  AUTH_OTP_ATTEMPTS_REMAINING: {
    messageHi: "Galat OTP. {count} prayas baaki.",
    messageEn: "Invalid OTP. {count} attempt(s) remaining.",
  },

  // ===== Validation Messages =====
  VAL_INVALID_INPUT: {
    messageHi: "Input data invalid hai.",
    messageEn: "Invalid input data.",
  },
  VAL_INVALID_MOBILE: {
    messageHi: "Mobile number invalid hai — 10 digit ka number jo 6-9 se shuru ho.",
    messageEn: "Invalid mobile number — must be 10 digits starting with 6-9.",
  },
  VAL_INVALID_OTP: {
    messageHi: "OTP 6 digit ka hona chahiye.",
    messageEn: "OTP must be exactly 6 digits.",
  },
  VAL_MISSING_FIELD: {
    messageHi: "Zaroori field missing hai: {field}.",
    messageEn: "Required field missing: {field}.",
  },

  // ===== Resource Messages =====
  RES_NOT_FOUND: {
    messageHi: "Sampada nahi mili.",
    messageEn: "Resource not found.",
  },
  RES_USER_NOT_FOUND: {
    messageHi: "User nahi mila.",
    messageEn: "User not found.",
  },
  RES_ALREADY_EXISTS: {
    messageHi: "Yeh data pehle se maujood hai.",
    messageEn: "This data already exists.",
  },
  RES_CONFLICT: {
    messageHi: "Data conflict hai.",
    messageEn: "Data conflict occurred.",
  },

  // ===== Permission Messages =====
  PERM_ADMIN_REQUIRED: {
    messageHi: "Admin access zaroori hai.",
    messageEn: "Admin access required.",
  },
  PERM_STAFF_REQUIRED: {
    messageHi: "Staff ya Admin access zaroori hai.",
    messageEn: "Staff or Admin access required.",
  },
  PERM_DENIED: {
    messageHi: "Aapke paas iske liye anumati nahi hai.",
    messageEn: "You do not have permission to access this resource.",
  },

  // ===== System Messages =====
  SYS_INTERNAL: {
    messageHi: "Antarik tatri hui. Kripya baad me prayas karein.",
    messageEn: "An unexpected error occurred. Please try again later.",
  },
  SYS_DATABASE: {
    messageHi: "Database error. Kripya baad me prayas karein.",
    messageEn: "Database error. Please try again later.",
  },
  SYS_SMS_FAILED: {
    messageHi: "OTP bhejne mein tatri hui. Kripya dobara prayas karein.",
    messageEn: "Failed to send OTP. Please try again.",
  },
  SYS_SERVICE_DOWN: {
    messageHi: "Service abhi uplabdh nahi hai. Kripya baad me prayas karein.",
    messageEn: "Service unavailable. Please try again later.",
  },
} as const;

// ==================== HELPER ====================

/**
 * Get message in preferred language
 * Defaults to Hindi (Hi) — our platform is Hindi-first
 */
function _getMessage(
  msg: HttpMessage,
  lang: "hi" | "en" = "hi"
): string {
  return lang === "en" ? msg.messageEn : msg.messageHi;
}

/**
 * Replace template variables in messages
 * Example: replaceVars("Galat OTP. {count} prayas baaki.", { count: 2 })
 *          → "Galat OTP. 2 prayas baaki."
 */
function _replaceVars(
  template: string,
  vars: Record<string, string | number>
): string {
  let result = template;
  for (const [key, value] of Object.entries(vars)) {
    result = result.replace(`{${key}}`, String(value));
  }
  return result;
}
