/**
 * Purpose: All enum/union types matching Prisma schema enums
 * Responsibility: Single source of truth for all enum types
 * Important Notes:
 *   - These MUST match prisma/schema.prisma enum values exactly
 *   - Used across both API and frontend
 */

// ==================== Auth Enums ====================

export type UserRole = "GUEST" | "USER" | "STAFF" | "ADMIN";

export type AuthProvider = "MOBILE" | "EMAIL" | "GOOGLE";

export type AuthOtpPurpose = "LOGIN" | "REGISTER" | "RESET";

export type AuthEventType =
  | "LOGIN_SUCCESS"
  | "LOGIN_FAILED"
  | "OTP_SENT"
  | "OTP_VERIFIED"
  | "LOGOUT"
  | "TOKEN_REFRESHED"
  | "REGISTER_EMAIL"
  | "REGISTER_GOOGLE"
  | "LOGIN_EMAIL"
  | "LOGIN_GOOGLE";

// ==================== Booking Enums ====================

export type BookingStatus =
  | "PENDING"
  | "CONFIRMED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED"
  | "NO_SHOW";

// ==================== Payment Enums ====================

export type PaymentStatus = "PENDING" | "SUCCESS" | "FAILED" | "REFUNDED";

export type PaymentProvider = "RAZORPAY" | "CASH" | "UPI";

export type RefundStatus = "PENDING" | "APPROVED" | "REJECTED" | "PROCESSED";

// ==================== Notification Enums ====================

export type NotificationChannel = "WHATSAPP" | "SMS" | "EMAIL" | "PUSH";

export type NotificationStatus = "PENDING" | "SENT" | "FAILED";

export type NotificationTrigger =
  | "BOOKING_CONFIRMED"
  | "BOOKING_REMINDER"
  | "BOOKING_CANCELLED"
  | "PAYMENT_RECEIVED"
  | "OFFER_APPLIED"
  | "LOYALTY_EARNED"
  | "LOYALTY_REDEEMED";

// ==================== Offer Enums ====================

export type DiscountType = "PERCENTAGE" | "FLAT_AMOUNT";

// ==================== Loyalty Enums ====================

export type LoyaltyTransactionType = "EARN" | "REDEEM" | "EXPIRE";

// ==================== Blog Enums ====================

export type BlogPostStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";

// ==================== Product Enums ====================

export type ProductSaleStatus = "PENDING" | "COMPLETED" | "CANCELLED";

export type InventoryTransactionType = "PURCHASE" | "SALE" | "ADJUSTMENT" | "DAMAGE";

// ==================== Consultation Enums ====================

export type ConsultationStatus = "PENDING" | "COMPLETED" | "CANCELLED";

// ==================== Expense Enums ====================

export type ExpenseCategory =
  | "RENT"
  | "SALARY"
  | "SUPPLIES"
  | "UTILITIES"
  | "MARKETING"
  | "MAINTENANCE"
  | "OTHER";

// ==================== Staff Enums ====================

export type StaffCommissionStatus = "PENDING" | "PAID";

// ==================== Media Enums ====================

export type MediaOwnerType =
  | "SERVICE"
  | "STAFF"
  | "PORTFOLIO"
  | "BRANCH"
  | "BLOG"
  | "PRODUCT"
  | "OFFER";
