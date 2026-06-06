/**
 * Purpose: Zod validation schemas for payment API routes
 * Responsibility: Validate all payment, verification, and refund API inputs
 * Important Notes:
 *   - One schema per API endpoint
 *   - Export both schema and inferred type
 *   - Hindi-first error messages
 */

import { z } from "zod";

// ==================== CREATE ORDER ====================

/** Body for POST /api/payments/create-order */
const _createOrderSchema = z.object({
  bookingId: z
    .string()
    .min(1, "बुकिंग ID आवश्यक है / Booking ID is required"),
});

export type CreateOrderInput = z.infer<typeof _createOrderSchema>;

// ==================== VERIFY PAYMENT ====================

/** Body for POST /api/payments/verify */
const _verifyPaymentSchema = z.object({
  bookingId: z
    .string()
    .min(1, "बुकिंग ID आवश्यक है / Booking ID is required"),
  razorpayOrderId: z
    .string()
    .min(1, "Razorpay ऑर्डर ID आवश्यक है / Razorpay order ID is required"),
  razorpayPaymentId: z
    .string()
    .min(1, "Razorpay भुगतान ID आवश्यक है / Razorpay payment ID is required"),
  razorpaySignature: z
    .string()
    .min(1, "Razorpay हस्ताक्षर आवश्यक है / Razorpay signature is required"),
});

export type VerifyPaymentInput = z.infer<typeof _verifyPaymentSchema>;

// ==================== CASH PAYMENT ====================

/** Body for POST /api/payments/cash */
export const cashPaymentSchema = z.object({
  bookingId: z
    .string()
    .min(1, "बुकिंग ID आवश्यक है / Booking ID is required"),
  amount: z
    .number()
    .positive("राशि शून्य से अधिक होनी चाहिए / Amount must be greater than zero"),
});

export type CashPaymentInput = z.infer<typeof cashPaymentSchema>;

// ==================== INITIATE REFUND ====================

/** Body for POST /api/payments/[id]/refund */
export const initiateRefundSchema = z.object({
  amount: z
    .number()
    .positive("रिफंड राशि शून्य से अधिक होनी चाहिए / Refund amount must be greater than zero"),
  reason: z
    .string()
    .min(1, "रिफंड कारण आवश्यक है / Refund reason is required")
    .max(500, "कारण अधिकतम 500 अक्षर / Reason must be at most 500 characters"),
});

export type InitiateRefundInput = z.infer<typeof initiateRefundSchema>;

// ==================== PROCESS REFUND ====================

/** Body for PATCH /api/payments/refunds/[refundId]/process */
export const processRefundSchema = z.object({
  status: z.enum(
    ["APPROVED", "REJECTED"],
    { message: "स्थिति APPROVED या REJECTED होनी चाहिए / Status must be APPROVED or REJECTED" }
  ),
  providerRefId: z
    .string()
    .min(1, "प्रदाता संदर्भ ID खाली नहीं हो सकता / Provider reference ID cannot be empty")
    .optional(),
});

export type ProcessRefundInput = z.infer<typeof processRefundSchema>;
