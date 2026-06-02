/**
 * Purpose: Custom error classes for the auth system
 * Responsibility: Structured error handling with codes, HTTP status, and messages
 * Important Notes:
 *   - Every API error throws these — never raw Error
 *   - api-handler catches these and returns proper JSON
 *   - Each error has: code (machine), statusCode (HTTP), message (human)
 *   - isOperational = true means expected error (4xx), false = unexpected (5xx)
 */

import { HTTP_STATUS, ERROR_CODES } from "@/shared/constants";

// ==================== BASE ERROR ====================

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
    super(ERROR_CODES.AUTH_MISSING_TOKEN, HTTP_STATUS.UNAUTHORIZED, "Missing authorization token. Please login.");
  }
}

export class AuthInvalidTokenError extends AppError {
  constructor() {
    super(ERROR_CODES.AUTH_INVALID_TOKEN, HTTP_STATUS.UNAUTHORIZED, "Invalid token. Please login again.");
  }
}

export class AuthSessionInvalidError extends AppError {
  constructor() {
    super(ERROR_CODES.AUTH_SESSION_INVALID, HTTP_STATUS.UNAUTHORIZED, "Session has been invalidated. Please login again.");
  }
}

export class AuthSessionRevokedError extends AppError {
  constructor() {
    super(ERROR_CODES.AUTH_SESSION_REVOKED, HTTP_STATUS.UNAUTHORIZED, "This session has been revoked. Please login again.");
  }
}

export class AuthAccountSuspendedError extends AppError {
  constructor() {
    super(ERROR_CODES.AUTH_ACCOUNT_SUSPENDED, HTTP_STATUS.UNAUTHORIZED, "Your account has been suspended. Please contact support.");
  }
}

export class AuthOtpInvalidError extends AppError {
  constructor(attemptsRemaining?: number) {
    const msg = attemptsRemaining !== undefined
      ? `Invalid OTP. ${attemptsRemaining} attempt(s) remaining.`
      : "Invalid OTP. Please enter the correct OTP.";
    super(ERROR_CODES.AUTH_OTP_INVALID, HTTP_STATUS.UNAUTHORIZED, msg);
  }
}

export class AuthOtpExpiredError extends AppError {
  constructor() {
    super(ERROR_CODES.AUTH_OTP_EXPIRED, HTTP_STATUS.UNAUTHORIZED, "OTP has expired. Please request a new OTP.");
  }
}

export class AuthOtpMaxAttemptsError extends AppError {
  constructor() {
    super(ERROR_CODES.AUTH_OTP_MAX_ATTEMPTS, HTTP_STATUS.UNAUTHORIZED, "Maximum verification attempts exceeded. Please request a new OTP.");
  }
}

export class AuthRateLimitedError extends AppError {
  constructor(public readonly retryAfterSeconds?: number) {
    super(ERROR_CODES.AUTH_RATE_LIMITED, HTTP_STATUS.RATE_LIMITED, "Too many requests. Please try again later.");
  }
}

export class AuthLoginLockedError extends AppError {
  constructor(public readonly retryAfterSeconds: number) {
    super(ERROR_CODES.AUTH_LOGIN_LOCKED, HTTP_STATUS.RATE_LIMITED, `Account temporarily locked. Try again in ${Math.ceil(retryAfterSeconds / 60)} minutes.`);
  }
}

export class AuthInvalidCredentialsError extends AppError {
  constructor() {
    super(ERROR_CODES.AUTH_INVALID_CREDENTIALS, HTTP_STATUS.UNAUTHORIZED, "Invalid email or password. Please try again.");
  }
}

export class AuthEmailExistsError extends AppError {
  constructor() {
    super(ERROR_CODES.AUTH_EMAIL_EXISTS, HTTP_STATUS.CONFLICT, "This email is already registered. Please login instead.");
  }
}

export class AuthPhoneExistsError extends AppError {
  constructor() {
    super(ERROR_CODES.AUTH_PHONE_EXISTS, HTTP_STATUS.CONFLICT, "This phone number is already registered. Please login instead.");
  }
}

export class AuthGoogleTokenInvalidError extends AppError {
  constructor() {
    super(ERROR_CODES.AUTH_GOOGLE_TOKEN_INVALID, HTTP_STATUS.UNAUTHORIZED, "Invalid Google token. Please try again.");
  }
}

export class AuthEmailNotVerifiedError extends AppError {
  constructor() {
    super(ERROR_CODES.AUTH_EMAIL_NOT_VERIFIED, HTTP_STATUS.UNAUTHORIZED, "Email not verified. Please check your email.");
  }
}

export class AuthMagicLinkInvalidError extends AppError {
  constructor() {
    super(ERROR_CODES.AUTH_MAGIC_LINK_INVALID, HTTP_STATUS.UNAUTHORIZED, "Invalid or expired magic link. Please request a new one.");
  }
}

export class AuthMagicLinkExpiredError extends AppError {
  constructor() {
    super(ERROR_CODES.AUTH_MAGIC_LINK_EXPIRED, HTTP_STATUS.UNAUTHORIZED, "Magic link has expired. Please request a new one.");
  }
}

export class AuthRefreshReuseError extends AppError {
  constructor() {
    super(ERROR_CODES.AUTH_REFRESH_REUSE, HTTP_STATUS.UNAUTHORIZED, "Token reuse detected. All sessions have been invalidated for security.");
  }
}

export class AuthPasswordResetInvalidError extends AppError {
  constructor() {
    super(ERROR_CODES.AUTH_PASSWORD_RESET_INVALID, HTTP_STATUS.UNAUTHORIZED, "Invalid or already used reset token. Please request a new one.");
  }
}

export class AuthPasswordResetExpiredError extends AppError {
  constructor() {
    super(ERROR_CODES.AUTH_PASSWORD_RESET_EXPIRED, HTTP_STATUS.UNAUTHORIZED, "Reset token has expired. Please request a new one.");
  }
}

export class AuthWrongPasswordError extends AppError {
  constructor() {
    super(ERROR_CODES.AUTH_WRONG_PASSWORD, HTTP_STATUS.UNAUTHORIZED, "Current password is incorrect.");
  }
}

export class AuthEmailTakenError extends AppError {
  constructor() {
    super(ERROR_CODES.AUTH_EMAIL_TAKEN, HTTP_STATUS.CONFLICT, "This email is already used by another account.");
  }
}

export class AuthPhoneTakenError extends AppError {
  constructor() {
    super(ERROR_CODES.AUTH_PHONE_TAKEN, HTTP_STATUS.CONFLICT, "This phone number is already used by another account.");
  }
}

export class UserNotFoundError extends AppError {
  constructor() {
    super(ERROR_CODES.USER_NOT_FOUND, HTTP_STATUS.NOT_FOUND, "User not found.");
  }
}

export class UserDeactivatedError extends AppError {
  constructor() {
    super(ERROR_CODES.USER_DEACTIVATED, HTTP_STATUS.FORBIDDEN, "This account has been deactivated.");
  }
}

export class UserAvatarTooLargeError extends AppError {
  constructor() {
    super(ERROR_CODES.USER_AVATAR_TOO_LARGE, HTTP_STATUS.BAD_REQUEST, "Avatar image must be less than 5MB.");
  }
}

export class UserAvatarInvalidTypeError extends AppError {
  constructor() {
    super(ERROR_CODES.USER_AVATAR_INVALID_TYPE, HTTP_STATUS.BAD_REQUEST, "Avatar must be a JPEG, PNG, or WebP image.");
  }
}

// ==================== VALIDATION ERRORS ====================

export class ValidationError extends AppError {
  public readonly fields?: Record<string, string[]>;
  constructor(message: string, fields?: Record<string, string[]>) {
    super(ERROR_CODES.VAL_INVALID_INPUT, HTTP_STATUS.BAD_REQUEST, message);
    this.fields = fields;
  }
}

// ==================== RESOURCE ERRORS ====================

export class NotFoundError extends AppError {
  constructor(message?: string) {
    super(ERROR_CODES.RES_NOT_FOUND, HTTP_STATUS.NOT_FOUND, message || "Resource not found.");
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(ERROR_CODES.RES_CONFLICT, HTTP_STATUS.CONFLICT, message);
  }
}

// ==================== PERMISSION ERRORS ====================

export class ForbiddenError extends AppError {
  constructor(message?: string) {
    super(ERROR_CODES.PERM_DENIED, HTTP_STATUS.FORBIDDEN, message || "You do not have permission to access this resource.");
  }
}

export class AdminRequiredError extends AppError {
  constructor() {
    super(ERROR_CODES.PERM_ADMIN_REQUIRED, HTTP_STATUS.FORBIDDEN, "Admin access required.");
  }
}

export class StaffRequiredError extends AppError {
  constructor() {
    super(ERROR_CODES.PERM_STAFF_REQUIRED, HTTP_STATUS.FORBIDDEN, "Staff or Admin access required.");
  }
}

// ==================== BRANCH ERRORS ====================

export class BranchNotFoundError extends AppError {
  constructor() {
    super(ERROR_CODES.BRANCH_NOT_FOUND, HTTP_STATUS.NOT_FOUND, "शाखा नहीं मिली। / Branch not found.");
  }
}

export class BranchAlreadyInactiveError extends AppError {
  constructor() {
    super(ERROR_CODES.BRANCH_ALREADY_INACTIVE, HTTP_STATUS.BAD_REQUEST, "यह शाखा पहले से निष्क्रिय है। / This branch is already inactive.");
  }
}

export class BranchHolidayConflictError extends AppError {
  constructor() {
    super(ERROR_CODES.BRANCH_HOLIDAY_CONFLICT, HTTP_STATUS.CONFLICT, "इस तारीख पर पहले से छुट्टी है। / Holiday already exists for this date.");
  }
}

export class BranchHolidayNotFoundError extends AppError {
  constructor() {
    super(ERROR_CODES.BRANCH_HOLIDAY_NOT_FOUND, HTTP_STATUS.NOT_FOUND, "छुट्टी नहीं मिली। / Holiday not found.");
  }
}

// ==================== SERVICE CATEGORY ERRORS ====================

export class ServiceCategoryNotFoundError extends AppError {
  constructor() {
    super(ERROR_CODES.SVC_CAT_NOT_FOUND, HTTP_STATUS.NOT_FOUND, "सेवा श्रेणी नहीं मिली। / Service category not found.");
  }
}

export class ServiceCategorySlugExistsError extends AppError {
  constructor() {
    super(ERROR_CODES.SVC_CAT_SLUG_EXISTS, HTTP_STATUS.CONFLICT, "यह slug पहले से उपयोग में है। / This slug is already in use.");
  }
}

export class ServiceCategoryAlreadyInactiveError extends AppError {
  constructor() {
    super(ERROR_CODES.SVC_CAT_ALREADY_INACTIVE, HTTP_STATUS.BAD_REQUEST, "यह श्रेणी पहले से निष्क्रिय है। / This category is already inactive.");
  }
}

// ==================== SERVICE ERRORS ====================

export class ServiceNotFoundError extends AppError {
  constructor() {
    super(ERROR_CODES.SVC_NOT_FOUND, HTTP_STATUS.NOT_FOUND, "सेवा नहीं मिली। / Service not found.");
  }
}

export class ServiceSlugExistsError extends AppError {
  constructor() {
    super(ERROR_CODES.SVC_SLUG_EXISTS, HTTP_STATUS.CONFLICT, "यह slug पहले से उपयोग में है। / This slug is already in use.");
  }
}

export class ServiceAlreadyInactiveError extends AppError {
  constructor() {
    super(ERROR_CODES.SVC_ALREADY_INACTIVE, HTTP_STATUS.BAD_REQUEST, "यह सेवा पहले से निष्क्रिय है। / This service is already inactive.");
  }
}

// ==================== SERVICE VARIANT ERRORS ====================

export class ServiceVariantNotFoundError extends AppError {
  constructor() {
    super(ERROR_CODES.SVC_VAR_NOT_FOUND, HTTP_STATUS.NOT_FOUND, "सेवा वेरिएंट नहीं मिला। / Service variant not found.");
  }
}

export class ServiceVariantAlreadyInactiveError extends AppError {
  constructor() {
    super(ERROR_CODES.SVC_VAR_ALREADY_INACTIVE, HTTP_STATUS.BAD_REQUEST, "यह वेरिएंट पहले से निष्क्रिय है। / This variant is already inactive.");
  }
}

// ==================== SERVICE ADD-ON ERRORS ====================

export class ServiceAddOnNotFoundError extends AppError {
  constructor() {
    super(ERROR_CODES.SVC_ADDON_NOT_FOUND, HTTP_STATUS.NOT_FOUND, "सेवा ऐड-ऑन नहीं मिला। / Service add-on not found.");
  }
}

export class ServiceAddOnAlreadyInactiveError extends AppError {
  constructor() {
    super(ERROR_CODES.SVC_ADDON_ALREADY_INACTIVE, HTTP_STATUS.BAD_REQUEST, "यह ऐड-ऑन पहले से निष्क्रिय है। / This add-on is already inactive.");
  }
}

// ==================== STAFF ERRORS ====================

export class StaffNotFoundError extends AppError {
  constructor() {
    super(ERROR_CODES.STAFF_NOT_FOUND, HTTP_STATUS.NOT_FOUND, "स्टाफ नहीं मिला। / Staff not found.");
  }
}

export class StaffAlreadyDeactivatedError extends AppError {
  constructor() {
    super(ERROR_CODES.STAFF_ALREADY_DEACTIVATED, HTTP_STATUS.BAD_REQUEST, "यह स्टाफ पहले से निष्क्रिय है। / This staff member is already deactivated.");
  }
}

export class StaffServiceAlreadyAssignedError extends AppError {
  constructor() {
    super(ERROR_CODES.STAFF_SERVICE_ALREADY_ASSIGNED, HTTP_STATUS.CONFLICT, "यह सेवा पहले से असाइन है। / This service is already assigned to the staff member.");
  }
}

export class StaffLeaveConflictError extends AppError {
  constructor() {
    super(ERROR_CODES.STAFF_LEAVE_CONFLICT, HTTP_STATUS.CONFLICT, "इस तारीख पर पहले से छुट्टी है। / Leave already exists for this date.");
  }
}

export class StaffLeaveNotFoundError extends AppError {
  constructor() {
    super(ERROR_CODES.STAFF_LEAVE_NOT_FOUND, HTTP_STATUS.NOT_FOUND, "छुट्टी नहीं मिली। / Staff leave not found.");
  }
}

// ==================== SLOT AVAILABILITY ERRORS ====================

export class SlotInvalidDateError extends AppError {
  constructor(message?: string) {
    super(ERROR_CODES.SLOT_INVALID_DATE, HTTP_STATUS.BAD_REQUEST, message || "अमान्य तारीख। कृपया आज या भविष्य की तारीख चुनें (अधिकतम 30 दिन)। / Invalid date. Please select today or a future date (max 30 days ahead).");
  }
}

export class SlotBranchClosedError extends AppError {
  constructor(reason?: string) {
    const msg = reason
      ? `शाखा इस तारीख को बंद है: ${reason} / Branch is closed on this date: ${reason}`
      : "शाखा इस तारीख को बंद है। / Branch is closed on this date.";
    super(ERROR_CODES.SLOT_BRANCH_CLOSED, HTTP_STATUS.BAD_REQUEST, msg);
  }
}

export class SlotServiceRequiredError extends AppError {
  constructor() {
    super(ERROR_CODES.SLOT_SERVICE_REQUIRED, HTTP_STATUS.BAD_REQUEST, "सेवा ID आवश्यक है। / Service ID is required for slot calculation.");
  }
}

export class SlotNoStaffAvailableError extends AppError {
  constructor() {
    super(ERROR_CODES.SLOT_NO_STAFF_AVAILABLE, HTTP_STATUS.NOT_FOUND, "इस सेवा के लिए कोई स्टाफ उपलब्ध नहीं है। / No staff available for this service.");
  }
}

// ==================== BOOKING ERRORS ====================

export class BookingNotFoundError extends AppError {
  constructor() {
    super(ERROR_CODES.BOOKING_NOT_FOUND, HTTP_STATUS.NOT_FOUND, "बुकिंग नहीं मिली। / Booking not found.");
  }
}

export class BookingSlotUnavailableError extends AppError {
  constructor() {
    super(ERROR_CODES.BOOKING_SLOT_UNAVAILABLE, HTTP_STATUS.CONFLICT, "यह स्लॉट अब उपलब्ध नहीं है। कृपया दूसरा स्लॉट चुनें। / This slot is no longer available. Please choose another slot.");
  }
}

export class BookingInvalidStatusTransitionError extends AppError {
  constructor(from: string, to: string) {
    super(ERROR_CODES.BOOKING_INVALID_STATUS_TRANSITION, HTTP_STATUS.BAD_REQUEST, `बुकिंग स्थिति ${from} से ${to} में नहीं बदली जा सकती। / Cannot transition booking status from ${from} to ${to}.`);
  }
}

export class BookingAlreadyCancelledError extends AppError {
  constructor() {
    super(ERROR_CODES.BOOKING_ALREADY_CANCELLED, HTTP_STATUS.BAD_REQUEST, "यह बुकिंग पहले से रद्द है। / This booking is already cancelled.");
  }
}

export class BookingCannotCancelError extends AppError {
  constructor() {
    super(ERROR_CODES.BOOKING_CANNOT_CANCEL, HTTP_STATUS.BAD_REQUEST, "इस बुकिंग को रद्द नहीं किया जा सकता। / Cannot cancel this booking.");
  }
}

export class BookingUnauthorizedError extends AppError {
  constructor() {
    super(ERROR_CODES.BOOKING_UNAUTHORIZED, HTTP_STATUS.FORBIDDEN, "आप इस बुकिंग तक अधिकृत नहीं हैं। / You are not authorized to access this booking.");
  }
}

export class BookingOfferInvalidError extends AppError {
  constructor() {
    super(ERROR_CODES.BOOKING_OFFER_INVALID, HTTP_STATUS.BAD_REQUEST, "यह ऑफर कोड अमान्य या समाप्त है। / This offer code is invalid or expired.");
  }
}

export class BookingOfferNotApplicableError extends AppError {
  constructor() {
    super(ERROR_CODES.BOOKING_OFFER_NOT_APPLICABLE, HTTP_STATUS.BAD_REQUEST, "यह ऑफर इस सेवा पर लागू नहीं होता। / This offer is not applicable to this service.");
  }
}

export class BookingOfferLimitReachedError extends AppError {
  constructor() {
    super(ERROR_CODES.BOOKING_OFFER_LIMIT_REACHED, HTTP_STATUS.BAD_REQUEST, "इस ऑफर की उपयोग सीमा समाप्त हो चुकी है। / This offer usage limit has been reached.");
  }
}

// ==================== OFFER ERRORS ====================

export class OfferNotFoundError extends AppError {
  constructor() {
    super(ERROR_CODES.OFFER_NOT_FOUND, HTTP_STATUS.NOT_FOUND, "ऑफर नहीं मिला। / Offer not found.");
  }
}

export class OfferCodeExistsError extends AppError {
  constructor() {
    super(ERROR_CODES.OFFER_CODE_EXISTS, HTTP_STATUS.CONFLICT, "यह ऑफर कोड पहले से उपयोग में है। / This offer code is already in use.");
  }
}

export class OfferExpiredError extends AppError {
  constructor() {
    super(ERROR_CODES.OFFER_EXPIRED, HTTP_STATUS.BAD_REQUEST, "यह ऑफर समाप्त हो चुका है। / This offer has expired.");
  }
}

export class OfferNotYetActiveError extends AppError {
  constructor() {
    super(ERROR_CODES.OFFER_NOT_YET_ACTIVE, HTTP_STATUS.BAD_REQUEST, "यह ऑफर अभी सक्रिय नहीं हुआ है। / This offer is not yet active.");
  }
}

export class OfferUsageLimitReachedError extends AppError {
  constructor() {
    super(ERROR_CODES.OFFER_USAGE_LIMIT_REACHED, HTTP_STATUS.BAD_REQUEST, "इस ऑफर की उपयोग सीमा समाप्त हो चुकी है। / This offer usage limit has been reached.");
  }
}

export class OfferMinOrderNotMetError extends AppError {
  constructor() {
    super(ERROR_CODES.OFFER_MIN_ORDER_NOT_MET, HTTP_STATUS.BAD_REQUEST, "बुकिंग राशि न्यूनतम ऑर्डर राशि से कम है। / Booking amount is below the minimum order amount.");
  }
}

export class OfferNotApplicableError extends AppError {
  constructor() {
    super(ERROR_CODES.OFFER_NOT_APPLICABLE, HTTP_STATUS.BAD_REQUEST, "यह ऑफर इस सेवा पर लागू नहीं होता। / This offer is not applicable to this service.");
  }
}

export class OfferServiceAlreadyLinkedError extends AppError {
  constructor() {
    super(ERROR_CODES.OFFER_SERVICE_ALREADY_LINKED, HTTP_STATUS.CONFLICT, "यह सेवा पहले से ऑफर से जुड़ी है। / This service is already linked to the offer.");
  }
}

export class OfferServiceLinkNotFoundError extends AppError {
  constructor() {
    super(ERROR_CODES.OFFER_SERVICE_LINK_NOT_FOUND, HTTP_STATUS.NOT_FOUND, "यह सेवा इस ऑफर से जुड़ी नहीं है। / This service is not linked to this offer.");
  }
}

export class OfferCodeImmutableError extends AppError {
  constructor() {
    super(ERROR_CODES.OFFER_CODE_IMMUTABLE, HTTP_STATUS.BAD_REQUEST, "ऑफर कोड बदला नहीं जा सकता। / Offer code cannot be changed after creation.");
  }
}

// ==================== PAYMENT ERRORS ====================

export class PaymentNotFoundError extends AppError {
  constructor() {
    super(ERROR_CODES.PAYMENT_NOT_FOUND, HTTP_STATUS.NOT_FOUND, "भुगतान नहीं मिला। / Payment not found.");
  }
}

export class PaymentAlreadySuccessError extends AppError {
  constructor() {
    super(ERROR_CODES.PAYMENT_ALREADY_SUCCESS, HTTP_STATUS.CONFLICT, "यह भुगतान पहले ही सफल हो चुका है। / This payment has already been marked as successful.");
  }
}

export class PaymentVerificationFailedError extends AppError {
  constructor() {
    super(ERROR_CODES.PAYMENT_VERIFICATION_FAILED, HTTP_STATUS.BAD_REQUEST, "भुगतान सत्यापन विफल हुआ। / Payment verification failed.");
  }
}

export class PaymentBookingMismatchError extends AppError {
  constructor() {
    super(ERROR_CODES.PAYMENT_BOOKING_MISMATCH, HTTP_STATUS.BAD_REQUEST, "भुगतान और बुकिंग मेल नहीं खाते। / Payment and booking do not match.");
  }
}

export class RefundNotFoundError extends AppError {
  constructor() {
    super(ERROR_CODES.REFUND_NOT_FOUND, HTTP_STATUS.NOT_FOUND, "रिफंड नहीं मिला। / Refund not found.");
  }
}

export class RefundAlreadyProcessedError extends AppError {
  constructor() {
    super(ERROR_CODES.REFUND_ALREADY_PROCESSED, HTTP_STATUS.CONFLICT, "यह रिफंड पहले ही प्रोसेस हो चुका है। / This refund has already been processed.");
  }
}

export class RefundAmountExceedsError extends AppError {
  constructor() {
    super(ERROR_CODES.REFUND_AMOUNT_EXCEEDS, HTTP_STATUS.BAD_REQUEST, "रिफंड राशि भुगतान राशि से अधिक है। / Refund amount exceeds payment amount.");
  }
}

// ==================== REVIEW ERRORS ====================

export class ReviewNotFoundError extends AppError {
  constructor() {
    super(ERROR_CODES.REVIEW_NOT_FOUND, HTTP_STATUS.NOT_FOUND, "समीक्षा नहीं मिली। / Review not found.");
  }
}

export class ReviewAlreadyExistsError extends AppError {
  constructor() {
    super(ERROR_CODES.REVIEW_ALREADY_EXISTS, HTTP_STATUS.CONFLICT, "इस बुकिंग की समीक्षा पहले से है। / A review already exists for this booking.");
  }
}

export class ReviewBookingNotCompletedError extends AppError {
  constructor() {
    super(ERROR_CODES.REVIEW_BOOKING_NOT_COMPLETED, HTTP_STATUS.BAD_REQUEST, "केवल पूरी हुई बुकिंग की समीक्षा की जा सकती है। / Only completed bookings can be reviewed.");
  }
}

export class ReviewUnauthorizedError extends AppError {
  constructor() {
    super(ERROR_CODES.REVIEW_UNAUTHORIZED, HTTP_STATUS.FORBIDDEN, "आप इस समीक्षा को हटाने के अधिकृत नहीं हैं। / You are not authorized to delete this review.");
  }
}

export class ReviewBookingNotOwnedError extends AppError {
  constructor() {
    super(ERROR_CODES.REVIEW_BOOKING_NOT_OWNED, HTTP_STATUS.FORBIDDEN, "यह बुकिंग आपकी नहीं है। / This booking does not belong to you.");
  }
}

// ==================== LOYALTY ERRORS ====================

export class LoyaltyInsufficientBalanceError extends AppError {
  constructor() {
    super(ERROR_CODES.LOYALTY_INSUFFICIENT_BALANCE, HTTP_STATUS.BAD_REQUEST, "पर्याप्त लॉयल्टी अंक नहीं हैं। / Insufficient loyalty points.");
  }
}

export class LoyaltyMinRedeemNotMetError extends AppError {
  constructor() {
    super(ERROR_CODES.LOYALTY_MIN_REDEEM_NOT_MET, HTTP_STATUS.BAD_REQUEST, "न्यूनतम 100 अंक रिडीम करने चाहिए। / Minimum 100 points required to redeem.");
  }
}

export class LoyaltyInvalidPointsError extends AppError {
  constructor() {
    super(ERROR_CODES.LOYALTY_INVALID_POINTS, HTTP_STATUS.BAD_REQUEST, "अंक शून्य से अधिक होने चाहिए। / Points must be greater than zero.");
  }
}

// ==================== SYSTEM ERRORS ====================

export class InternalError extends AppError {
  constructor(message?: string) {
    super(ERROR_CODES.SYS_INTERNAL, HTTP_STATUS.INTERNAL_ERROR, message || "An unexpected error occurred.", false);
  }
}

export class DatabaseError extends AppError {
  constructor() {
    super(ERROR_CODES.SYS_DATABASE, HTTP_STATUS.INTERNAL_ERROR, "Database error. Please try again later.", false);
  }
}

export class RedisError extends AppError {
  constructor() {
    super(ERROR_CODES.SYS_REDIS_ERROR, HTTP_STATUS.INTERNAL_ERROR, "Service temporarily unavailable. Please try again.", false);
  }
}

// ==================== HELPERS ====================

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

export function toAppError(error: unknown): AppError {
  if (isAppError(error)) return error;
  if (error instanceof Error) return new InternalError(error.message);
  return new InternalError();
}
