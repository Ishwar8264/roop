/**
 * Purpose: Zod validation schemas for Payments & Refunds API routes
 * Responsibility: Validate all payment and refund API inputs using shared primitives
 * Important Notes:
 *   - Uses common schemas from validations/common.ts
 *   - One schema per API endpoint
 *   - Export both schema and inferred type
 *   - All monetary values as decimal strings
 *   - Payment providers: RAZORPAY, CASH, UPI
 */

import { z } from "zod";
import { cuid, decimalString, pageParam, pageSizeParam } from "../common";

// ==================== PAYMENT PROVIDER ENUM ====================

/** Payment provider enum matching Prisma PaymentProvider */
export const paymentProviderEnum = z.enum(["RAZORPAY", "CASH", "UPI"]);

// ==================== PAYMENT STATUS ENUM ====================

/** Payment status enum matching Prisma PaymentStatus */
export const paymentStatusEnum = z.enum(["PENDING", "SUCCESS", "FAILED", "REFUNDED"]);

// ==================== REFUND STATUS ENUM ====================

/** Refund status enum matching Prisma RefundStatus */
export const refundStatusEnum = z.enum(["PENDING", "APPROVED", "REJECTED", "PROCESSED"]);

// ==================== CREATE PAYMENT ====================

/** POST /api/payments/create-order */
export const createPaymentSchema = z.object({
  bookingId: cuid,
  provider: paymentProviderEnum,
  amount: decimalString,
});

export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;

// ==================== VERIFY PAYMENT ====================

/** POST /api/payments/verify */
export const verifyPaymentSchema = z.object({
  paymentId: cuid,
  providerRefId: z.string().min(1, "Provider reference ID is required"),
  providerOrderId: z.string().min(1, "Provider order ID is required"),
});

export type VerifyPaymentInput = z.infer<typeof verifyPaymentSchema>;

// ==================== LIST PAYMENTS QUERY ====================

/** GET /api/payments — query params */
export const listPaymentsQuerySchema = z.object({
  bookingId: cuid.optional(),
  status: paymentStatusEnum.optional(),
  provider: paymentProviderEnum.optional(),
  page: pageParam,
  pageSize: pageSizeParam,
});

export type ListPaymentsQueryInput = z.infer<typeof listPaymentsQuerySchema>;

// ==================== CREATE REFUND ====================

/** POST /api/refunds */
export const createRefundSchema = z.object({
  paymentId: cuid,
  amount: decimalString,
  reason: z.string().min(1, "Refund reason is required"),
});

export type CreateRefundInput = z.infer<typeof createRefundSchema>;

// ==================== PROCESS REFUND ====================

/** PATCH /api/refunds/[id] */
export const processRefundSchema = z.object({
  status: refundStatusEnum.refine(
    (val) => ["APPROVED", "REJECTED", "PROCESSED"].includes(val),
    "Status must be APPROVED, REJECTED, or PROCESSED"
  ),
  providerRefId: z.string().optional(),
});

export type ProcessRefundInput = z.infer<typeof processRefundSchema>;
