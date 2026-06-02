/**
 * Purpose: Payment feature types — shared across service, routes, and client
 * Responsibility: Type definitions for payment, refund, and Razorpay integration APIs
 * Important Notes:
 *   - These are API response types — never expose raw Prisma models
 *   - All monetary values returned as numbers (converted from Prisma Decimal)
 *   - Date fields returned as ISO strings for frontend convenience
 */

// ==================== ENUMS ====================

/** Payment provider — mirrors Prisma PaymentProvider enum */
export type PaymentProvider = "RAZORPAY" | "CASH" | "UPI";

/** Payment status — mirrors Prisma PaymentStatus enum */
export type PaymentStatus = "PENDING" | "SUCCESS" | "FAILED" | "REFUNDED";

/** Refund status — mirrors Prisma RefundStatus enum */
export type RefundStatus = "PENDING" | "APPROVED" | "REJECTED" | "PROCESSED";

// ==================== PAYMENT RESPONSE ====================

/** Refund info within payment response */
export interface RefundItemResponse {
  id: string;
  amount: number;
  reason: string;
  status: RefundStatus;
  processedBy: string | null;
  providerRefId: string | null;
  processedAt: string | null;
  createdAt: string;
}

/** Payment response — used in list and detail */
export interface PaymentResponse {
  id: string;
  bookingId: string;
  amount: number;
  provider: PaymentProvider;
  status: PaymentStatus;
  providerRefId: string | null;
  providerOrderId: string | null;
  receiptUrl: string | null;
  paidAt: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Payment detail response — includes refunds */
export interface PaymentDetailResponse extends PaymentResponse {
  refunds: RefundItemResponse[];
}

/** Payments list for a booking */
export interface BookingPaymentsResponse {
  bookingId: string;
  payments: PaymentDetailResponse[];
}

// ==================== RAZORPAY ORDER ====================

/** Response for POST /api/payments/create-order */
export interface CreateOrderResponse {
  paymentId: string;
  orderId: string;
  amount: number;
  currency: string;
  keyId: string;
}

// ==================== VERIFY PAYMENT ====================

/** Response for POST /api/payments/verify */
export interface VerifyPaymentResponse {
  paymentId: string;
  status: PaymentStatus;
  message: string;
}

// ==================== CASH PAYMENT ====================

/** Response for POST /api/payments/cash */
export interface CashPaymentResponse {
  paymentId: string;
  bookingId: string;
  amount: number;
  status: PaymentStatus;
  paidAt: string;
}

// ==================== REFUND ====================

/** Response for POST /api/payments/[id]/refund */
export interface InitiateRefundResponse {
  refundId: string;
  paymentId: string;
  amount: number;
  reason: string;
  status: RefundStatus;
  createdAt: string;
}

/** Response for PATCH /api/payments/refunds/[refundId]/process */
export interface ProcessRefundResponse {
  refundId: string;
  paymentId: string;
  status: RefundStatus;
  paymentStatus: PaymentStatus;
  processedAt: string | null;
}
