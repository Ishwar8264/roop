/**
 * Purpose: Custom error classes for Nikharta Roop API
 * Responsibility: Structured error handling with error codes, HTTP status, and messages
 * Important Notes:
 *   - Every API error should throw these classes — never raw Error
 *   - api-handler.ts catches these and returns proper JSON responses
 *   - Each error has: code (machine), statusCode (HTTP), message (human)
 *   - Supports i18n messages via HttpMessage type
 */

import { HTTP_STATUS, ERROR_CODES, HTTP_MESSAGES, type HttpMessage } from "./http";

// ==================== BASE ERROR ====================

/**
 * Base application error — all custom errors extend this
 * Never throw this directly — use specific subclasses
 */
export class AppError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(
    code: string,
    statusCode: number,
    message: string,
    isOperational: boolean = true
  ) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

// ==================== AUTH ERRORS ====================

export class AuthMissingTokenError extends AppError {
  constructor() {
    super(
      ERROR_CODES.AUTH_MISSING_TOKEN,
      HTTP_STATUS.UNAUTHORIZED,
      HTTP_MESSAGES.AUTH_MISSING_TOKEN.messageEn
    );
  }
}

export class AuthInvalidTokenError extends AppError {
  constructor() {
    super(
      ERROR_CODES.AUTH_INVALID_TOKEN,
      HTTP_STATUS.UNAUTHORIZED,
      HTTP_MESSAGES.AUTH_INVALID_TOKEN.messageEn
    );
  }
}

export class AuthSessionInvalidError extends AppError {
  constructor() {
    super(
      ERROR_CODES.AUTH_SESSION_INVALID,
      HTTP_STATUS.UNAUTHORIZED,
      HTTP_MESSAGES.AUTH_SESSION_INVALID.messageEn
    );
  }
}

export class AuthAccountSuspendedError extends AppError {
  constructor() {
    super(
      ERROR_CODES.AUTH_ACCOUNT_SUSPENDED,
      HTTP_STATUS.UNAUTHORIZED,
      HTTP_MESSAGES.AUTH_ACCOUNT_SUSPENDED.messageEn
    );
  }
}

export class AuthOtpInvalidError extends AppError {
  constructor(attemptsRemaining?: number) {
    const msg = attemptsRemaining !== undefined
      ? `${HTTP_MESSAGES.AUTH_OTP_INVALID.messageEn} ${attemptsRemaining} attempt(s) remaining.`
      : HTTP_MESSAGES.AUTH_OTP_INVALID.messageEn;
    super(
      ERROR_CODES.AUTH_OTP_INVALID,
      HTTP_STATUS.UNAUTHORIZED,
      msg
    );
  }
}

export class AuthOtpExpiredError extends AppError {
  constructor() {
    super(
      ERROR_CODES.AUTH_OTP_EXPIRED,
      HTTP_STATUS.UNAUTHORIZED,
      HTTP_MESSAGES.AUTH_OTP_EXPIRED.messageEn
    );
  }
}

export class AuthOtpMaxAttemptsError extends AppError {
  constructor() {
    super(
      ERROR_CODES.AUTH_OTP_MAX_ATTEMPTS,
      HTTP_STATUS.UNAUTHORIZED,
      HTTP_MESSAGES.AUTH_OTP_MAX_ATTEMPTS.messageEn
    );
  }
}

export class AuthOtpAlreadySentError extends AppError {
  constructor(public readonly retryAfterSeconds?: number) {
    super(
      ERROR_CODES.AUTH_OTP_ALREADY_SENT,
      HTTP_STATUS.RATE_LIMITED,
      HTTP_MESSAGES.AUTH_OTP_ALREADY_SENT.messageEn
    );
  }
}

export class AuthRateLimitedError extends AppError {
  constructor(public readonly retryAfterSeconds?: number) {
    super(
      ERROR_CODES.AUTH_RATE_LIMITED,
      HTTP_STATUS.RATE_LIMITED,
      HTTP_MESSAGES.AUTH_RATE_LIMITED.messageEn
    );
  }
}

export class AuthHourlyLimitError extends AppError {
  constructor(public readonly retryAfterSeconds?: number) {
    super(
      ERROR_CODES.AUTH_HOURLY_LIMIT,
      HTTP_STATUS.RATE_LIMITED,
      HTTP_MESSAGES.AUTH_HOURLY_LIMIT.messageEn
    );
  }
}

export class AuthNoValidOtpError extends AppError {
  constructor() {
    super(
      ERROR_CODES.AUTH_OTP_EXPIRED,
      HTTP_STATUS.UNAUTHORIZED,
      HTTP_MESSAGES.AUTH_OTP_NO_VALID.messageEn
    );
  }
}

export class AuthSmsFailedError extends AppError {
  constructor() {
    super(
      ERROR_CODES.SYS_SMS_FAILED,
      HTTP_STATUS.INTERNAL_ERROR,
      HTTP_MESSAGES.SYS_SMS_FAILED.messageEn
    );
  }
}

export class AuthEmailExistsError extends AppError {
  constructor() {
    super(
      ERROR_CODES.AUTH_EMAIL_EXISTS,
      HTTP_STATUS.CONFLICT,
      HTTP_MESSAGES.AUTH_EMAIL_EXISTS.messageEn
    );
  }
}

export class AuthMobileExistsError extends AppError {
  constructor() {
    super(
      ERROR_CODES.AUTH_MOBILE_EXISTS,
      HTTP_STATUS.CONFLICT,
      HTTP_MESSAGES.AUTH_MOBILE_EXISTS.messageEn
    );
  }
}

export class AuthInvalidCredentialsError extends AppError {
  constructor() {
    super(
      ERROR_CODES.AUTH_INVALID_CREDENTIALS,
      HTTP_STATUS.UNAUTHORIZED,
      HTTP_MESSAGES.AUTH_INVALID_CREDENTIALS.messageEn
    );
  }
}

export class AuthGoogleTokenInvalidError extends AppError {
  constructor() {
    super(
      ERROR_CODES.AUTH_GOOGLE_TOKEN_INVALID,
      HTTP_STATUS.UNAUTHORIZED,
      HTTP_MESSAGES.AUTH_GOOGLE_TOKEN_INVALID.messageEn
    );
  }
}

export class AuthEmailNotVerifiedError extends AppError {
  constructor() {
    super(
      ERROR_CODES.AUTH_EMAIL_NOT_VERIFIED,
      HTTP_STATUS.UNAUTHORIZED,
      HTTP_MESSAGES.AUTH_EMAIL_NOT_VERIFIED.messageEn
    );
  }
}

// ==================== VALIDATION ERRORS ====================

export class ValidationError extends AppError {
  public readonly fields?: Record<string, string[]>;

  constructor(message: string, fields?: Record<string, string[]>) {
    super(
      ERROR_CODES.VAL_INVALID_INPUT,
      HTTP_STATUS.BAD_REQUEST,
      message
    );
    this.fields = fields;
  }
}

// ==================== RESOURCE ERRORS ====================

export class NotFoundError extends AppError {
  constructor(message?: string) {
    super(
      ERROR_CODES.RES_NOT_FOUND,
      HTTP_STATUS.NOT_FOUND,
      message || HTTP_MESSAGES.RES_NOT_FOUND.messageEn
    );
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(
      ERROR_CODES.RES_CONFLICT,
      HTTP_STATUS.CONFLICT,
      message
    );
  }
}

// ==================== PERMISSION ERRORS ====================

export class ForbiddenError extends AppError {
  constructor(message?: string) {
    super(
      ERROR_CODES.PERM_DENIED,
      HTTP_STATUS.FORBIDDEN,
      message || HTTP_MESSAGES.PERM_DENIED.messageEn
    );
  }
}

export class AdminRequiredError extends AppError {
  constructor() {
    super(
      ERROR_CODES.PERM_ADMIN_REQUIRED,
      HTTP_STATUS.FORBIDDEN,
      HTTP_MESSAGES.PERM_ADMIN_REQUIRED.messageEn
    );
  }
}

export class StaffRequiredError extends AppError {
  constructor() {
    super(
      ERROR_CODES.PERM_STAFF_REQUIRED,
      HTTP_STATUS.FORBIDDEN,
      HTTP_MESSAGES.PERM_STAFF_REQUIRED.messageEn
    );
  }
}

// ==================== SYSTEM ERRORS ====================

export class InternalError extends AppError {
  constructor(message?: string) {
    super(
      ERROR_CODES.SYS_INTERNAL,
      HTTP_STATUS.INTERNAL_ERROR,
      message || HTTP_MESSAGES.SYS_INTERNAL.messageEn,
      false // Not operational — unexpected error
    );
  }
}

export class DatabaseError extends AppError {
  constructor() {
    super(
      ERROR_CODES.SYS_DATABASE,
      HTTP_STATUS.INTERNAL_ERROR,
      HTTP_MESSAGES.SYS_DATABASE.messageEn,
      false
    );
  }
}

// ==================== HELPER ====================

/**
 * Check if an error is an AppError (our custom class)
 * Used in error handler to distinguish expected vs unexpected errors
 */
export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

/**
 * Convert unknown error to AppError
 * If it's already an AppError, return as-is
 * If it's a native Error, wrap in InternalError
 * If it's something else, wrap in InternalError with generic message
 */
export function toAppError(error: unknown): AppError {
  if (isAppError(error)) return error;
  if (error instanceof Error) {
    return new InternalError(error.message);
  }
  return new InternalError();
}
