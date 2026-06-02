/**
 * Purpose: Payment business logic service
 * Responsibility: All payment CRUD + Razorpay stubs + refund operations
 * Important Notes:
 *   - Business logic lives HERE, NOT in route handlers
 *   - Razorpay integration is stubbed — TODO comments for real SDK integration
 *   - Decimal handling: all money fields as Prisma Decimal, return as numbers
 *   - Hindi-first user-facing messages in errors
 *   - URL-based ID extraction from request.url pathname
 *   - Payment verification is stubbed — marks as SUCCESS for now
 *   - Cash payments: directly SUCCESS status, no provider verification needed
 *   - Refund flow: PENDING → APPROVED/REJECTED → PROCESSED
 */

import { prisma } from "@/lib/database/prisma";
import { requireAdmin, requireAuth } from "@/lib/server/auth-hooks";
import {
  PaymentNotFoundError,
  PaymentAlreadySuccessError,
  PaymentBookingMismatchError,
  RefundNotFoundError,
  RefundAlreadyProcessedError,
  RefundAmountExceedsError,
  BookingNotFoundError,
} from "@/lib/server/errors";
import type {
  PaymentResponse,
  PaymentDetailResponse,
  BookingPaymentsResponse,
  CreateOrderResponse,
  VerifyPaymentResponse,
  CashPaymentResponse,
  InitiateRefundResponse,
  ProcessRefundResponse,
  RefundItemResponse,
  PaymentProvider,
  PaymentStatus,
  RefundStatus,
} from "@/features/payment/types";
import type {
  CreateOrderInput,
  CashPaymentInput,
  InitiateRefundInput,
  ProcessRefundInput,
} from "@/features/payment/validations/payment";
import { Prisma } from "@prisma/client";

// Re-export auth hooks for convenience in route files
export { requireAdmin, requireAuth };

// ==================== DECIMAL HELPERS ====================

/** Convert Prisma Decimal to number for API response */
function decimalToNumber(value: unknown): number {
  if (value === null || value === undefined) return 0;
  return Number(value);
}

// ==================== URL HELPERS ====================

/**
 * Extract payment ID from URL pathname
 * Works for /api/payments/[id]/... patterns
 */
export function extractPaymentIdFromUrl(url: string): string {
  const pathname = new URL(url).pathname;
  const segments = pathname.split("/").filter(Boolean);
  // /api/payments/[id]/... → segments: ['api', 'payments', 'id', ...]
  return segments[2] || "";
}

/**
 * Extract booking ID from URL pathname
 * Works for /api/payments/booking/[bookingId]
 */
export function extractBookingIdFromPaymentUrl(url: string): string {
  const pathname = new URL(url).pathname;
  const segments = pathname.split("/").filter(Boolean);
  // /api/payments/booking/[bookingId] → segments: ['api', 'payments', 'booking', 'bookingId']
  return segments[3] || "";
}

/**
 * Extract refund ID from URL pathname
 * Works for /api/payments/refunds/[refundId]/process
 */
export function extractRefundIdFromUrl(url: string): string {
  const pathname = new URL(url).pathname;
  const segments = pathname.split("/").filter(Boolean);
  // /api/payments/refunds/[refundId]/process → segments: ['api', 'payments', 'refunds', 'refundId', ...]
  return segments[3] || "";
}

// ==================== MAPPER ====================

/** Map Prisma Refund to API response */
function mapRefundToResponse(refund: {
  id: string;
  amount: unknown;
  reason: string;
  status: string;
  processedBy: string | null;
  providerRefId: string | null;
  processedAt: Date | null;
  createdAt: Date;
}): RefundItemResponse {
  return {
    id: refund.id,
    amount: decimalToNumber(refund.amount),
    reason: refund.reason,
    status: refund.status as RefundStatus,
    processedBy: refund.processedBy,
    providerRefId: refund.providerRefId,
    processedAt: refund.processedAt?.toISOString() ?? null,
    createdAt: refund.createdAt.toISOString(),
  };
}

/** Map Prisma Payment (with refunds) to detail response */
function mapPaymentToDetailResponse(payment: {
  id: string;
  bookingId: string;
  amount: unknown;
  provider: string;
  status: string;
  providerRefId: string | null;
  providerOrderId: string | null;
  receiptUrl: string | null;
  paidAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  refunds: Array<{
    id: string;
    amount: unknown;
    reason: string;
    status: string;
    processedBy: string | null;
    providerRefId: string | null;
    processedAt: Date | null;
    createdAt: Date;
  }>;
}): PaymentDetailResponse {
  return {
    id: payment.id,
    bookingId: payment.bookingId,
    amount: decimalToNumber(payment.amount),
    provider: payment.provider as PaymentProvider,
    status: payment.status as PaymentStatus,
    providerRefId: payment.providerRefId,
    providerOrderId: payment.providerOrderId,
    receiptUrl: payment.receiptUrl,
    paidAt: payment.paidAt?.toISOString() ?? null,
    createdAt: payment.createdAt.toISOString(),
    updatedAt: payment.updatedAt.toISOString(),
    refunds: payment.refunds.map(mapRefundToResponse),
  };
}

// ==================== CREATE RAZORPAY ORDER ====================

/**
 * Create Razorpay order for a booking
 * Auth: any authenticated user (booking must belong to user)
 * Steps:
 *   1. Validate booking exists and belongs to user
 *   2. Create Razorpay order (stubbed for now)
 *   3. Create Payment record with PENDING status
 *   4. Return order details + keyId for frontend
 */
export async function createOrder(
  data: CreateOrderInput,
  userId: string
): Promise<CreateOrderResponse> {
  // 1. Validate booking exists and belongs to user
  const booking = await prisma.booking.findUnique({
    where: { id: data.bookingId },
    select: { id: true, userId: true, totalAmount: true, status: true },
  });

  if (!booking) {
    throw new BookingNotFoundError();
  }

  if (booking.userId !== userId) {
    throw new PaymentBookingMismatchError();
  }

  const amount = booking.totalAmount;

  // 2. Create Razorpay order (STUB)
  // TODO: Integrate with Razorpay SDK
  // const razorpayOrder = await razorpay.orders.create({
  //   amount: amount * 100, // Razorpay expects amount in paise
  //   currency: "INR",
  //   receipt: booking.id,
  // });
  const stubOrderId = `order_stub_${Date.now()}`;

  // 3. Create Payment record with PENDING status
  const payment = await prisma.payment.create({
    data: {
      bookingId: booking.id,
      amount,
      provider: "RAZORPAY",
      status: "PENDING",
      providerOrderId: stubOrderId,
    },
  });

  // 4. Return order details
  // TODO: Use real Razorpay keyId from env
  const keyId = process.env.RAZORPAY_KEY_ID || "rzp_test_stub_key";

  return {
    paymentId: payment.id,
    orderId: stubOrderId,
    amount: decimalToNumber(amount),
    currency: "INR",
    keyId,
  };
}

// ==================== VERIFY PAYMENT ====================

/**
 * Verify Razorpay payment signature
 * Auth: any authenticated user (booking must belong to user)
 * Steps:
 *   1. Find PENDING payment by providerOrderId
 *   2. Verify booking belongs to user
 *   3. Verify signature (stubbed — just mark as SUCCESS)
 *   4. Update payment status to SUCCESS
 *   5. Update booking advanceAmount if partial payment
 */
export async function verifyPayment(
  data: {
    bookingId: string;
    razorpayOrderId: string;
    razorpayPaymentId: string;
    razorpaySignature: string;
  },
  userId: string
): Promise<VerifyPaymentResponse> {
  // 1. Find payment by providerOrderId
  const payment = await prisma.payment.findFirst({
    where: { providerOrderId: data.razorpayOrderId },
  });

  if (!payment) {
    throw new PaymentNotFoundError();
  }

  // 2. Verify booking belongs to user
  if (payment.bookingId !== data.bookingId) {
    throw new PaymentBookingMismatchError();
  }

  const booking = await prisma.booking.findUnique({
    where: { id: data.bookingId },
    select: { userId: true, totalAmount: true, advanceAmount: true },
  });

  if (!booking || booking.userId !== userId) {
    throw new PaymentBookingMismatchError();
  }

  // 3. Check payment is not already successful
  if (payment.status === "SUCCESS") {
    throw new PaymentAlreadySuccessError();
  }

  // 4. Verify signature (STUB)
  // TODO: Integrate with Razorpay SDK for real signature verification
  // const isValid = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
  //   .update(`${data.razorpayOrderId}|${data.razorpayPaymentId}`)
  //   .digest('hex') === data.razorpaySignature;
  // if (!isValid) throw new PaymentVerificationFailedError();

  // 5. Update payment status to SUCCESS
  const updatedPayment = await prisma.payment.update({
    where: { id: payment.id },
    data: {
      status: "SUCCESS",
      providerRefId: data.razorpayPaymentId,
      paidAt: new Date(),
      metadata: {
        razorpayOrderId: data.razorpayOrderId,
        razorpayPaymentId: data.razorpayPaymentId,
        verifiedAt: new Date().toISOString(),
      },
    },
  });

  // 6. Update booking advanceAmount
  const currentAdvance = booking.advanceAmount ?? new Prisma.Decimal(0);
  const newAdvance = currentAdvance.add(payment.amount);

  await prisma.booking.update({
    where: { id: data.bookingId },
    data: { advanceAmount: newAdvance },
  });

  return {
    paymentId: updatedPayment.id,
    status: "SUCCESS",
    message: "भुगतान सफलतापूर्वक सत्यापित हुआ। / Payment verified successfully.",
  };
}

// ==================== CASH PAYMENT ====================

/**
 * Record a cash payment (admin only)
 * Creates Payment with CASH provider and SUCCESS status directly
 */
export async function recordCashPayment(
  data: CashPaymentInput
): Promise<CashPaymentResponse> {
  // Validate booking exists
  const booking = await prisma.booking.findUnique({
    where: { id: data.bookingId },
    select: { id: true, advanceAmount: true },
  });

  if (!booking) {
    throw new BookingNotFoundError();
  }

  // Create payment with SUCCESS status directly
  const payment = await prisma.payment.create({
    data: {
      bookingId: data.bookingId,
      amount: data.amount,
      provider: "CASH",
      status: "SUCCESS",
      paidAt: new Date(),
    },
  });

  // Update booking advanceAmount
  const currentAdvance = booking.advanceAmount ?? new Prisma.Decimal(0);
  const newAdvance = currentAdvance.add(data.amount);

  await prisma.booking.update({
    where: { id: data.bookingId },
    data: { advanceAmount: newAdvance },
  });

  return {
    paymentId: payment.id,
    bookingId: payment.bookingId,
    amount: decimalToNumber(payment.amount),
    status: "SUCCESS",
    paidAt: payment.paidAt!.toISOString(),
  };
}

// ==================== GET PAYMENTS FOR BOOKING ====================

/**
 * Get all payments for a booking, including refunds
 * Auth: booking owner or ADMIN
 */
export async function getBookingPayments(
  bookingId: string,
  userId: string,
  userRole: string
): Promise<BookingPaymentsResponse> {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    select: { id: true, userId: true },
  });

  if (!booking) {
    throw new BookingNotFoundError();
  }

  // Authorization check
  if (userRole === "USER" && booking.userId !== userId) {
    throw new PaymentBookingMismatchError();
  }

  const payments = await prisma.payment.findMany({
    where: { bookingId },
    include: {
      refunds: {
        orderBy: { createdAt: "desc" },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return {
    bookingId,
    payments: payments.map(mapPaymentToDetailResponse),
  };
}

// ==================== INITIATE REFUND ====================

/**
 * Initiate a refund for a payment
 * Admin only
 * Creates Refund record with PENDING status
 */
export async function initiateRefund(
  paymentId: string,
  data: InitiateRefundInput,
  processedBy: string
): Promise<InitiateRefundResponse> {
  // Validate payment exists
  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    select: { id: true, amount: true, status: true },
  });

  if (!payment) {
    throw new PaymentNotFoundError();
  }

  // Check refund amount doesn't exceed payment amount
  if (new Prisma.Decimal(data.amount).greaterThan(payment.amount)) {
    throw new RefundAmountExceedsError();
  }

  // Create refund record
  const refund = await prisma.refund.create({
    data: {
      paymentId,
      amount: data.amount,
      reason: data.reason,
      status: "PENDING",
      processedBy,
    },
  });

  return {
    refundId: refund.id,
    paymentId: refund.paymentId,
    amount: decimalToNumber(refund.amount),
    reason: refund.reason,
    status: "PENDING",
    createdAt: refund.createdAt.toISOString(),
  };
}

// ==================== PROCESS REFUND ====================

/**
 * Process a refund — approve, reject, or mark as processed
 * Admin only
 */
export async function processRefund(
  refundId: string,
  data: ProcessRefundInput,
  processedBy: string
): Promise<ProcessRefundResponse> {
  // Validate refund exists
  const refund = await prisma.refund.findUnique({
    where: { id: refundId },
    include: {
      payment: {
        select: { id: true, status: true },
      },
    },
  });

  if (!refund) {
    throw new RefundNotFoundError();
  }

  // Check refund hasn't already been processed (APPROVED, REJECTED, or PROCESSED)
  if (refund.status !== "PENDING") {
    throw new RefundAlreadyProcessedError();
  }

  // Update refund in transaction
  const result = await prisma.$transaction(async (tx) => {
    // Update refund
    const updatedRefund = await tx.refund.update({
      where: { id: refundId },
      data: {
        status: data.status,
        processedBy,
        providerRefId: data.providerRefId ?? null,
        processedAt: new Date(),
      },
    });

    // If approved, also update payment status to REFUNDED
    let paymentStatus = refund.payment.status as PaymentStatus;
    if (data.status === "APPROVED") {
      // Mark payment as REFUNDED when refund is approved
      await tx.payment.update({
        where: { id: refund.paymentId },
        data: { status: "REFUNDED" },
      });
      paymentStatus = "REFUNDED";
    }

    return {
      refundId: updatedRefund.id,
      paymentId: refund.paymentId,
      status: updatedRefund.status as RefundStatus,
      paymentStatus,
      processedAt: updatedRefund.processedAt?.toISOString() ?? null,
    };
  });

  return result;
}
