/**
 * Purpose: Payment domain types
 * Responsibility: Types matching Payment, Refund, Offer, OfferService,
 *                OfferRedemption, LoyaltyTransaction Prisma models
 */

import type { PaymentStatus, PaymentProvider, DiscountType, RefundStatus, LoyaltyTransactionType } from "./enums";

export interface Payment {
  id: string;
  bookingId: string;
  amount: string; // Decimal
  provider: PaymentProvider;
  status: PaymentStatus;
  providerRefId: string | null;
  providerOrderId: string | null;
  receiptUrl: string | null;
  metadata: Record<string, unknown> | null;
  paidAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Refund {
  id: string;
  paymentId: string;
  amount: string; // Decimal
  reason: string;
  status: RefundStatus;
  processedBy: string | null;
  providerRefId: string | null;
  metadata: Record<string, unknown> | null;
  processedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Offer {
  id: string;
  code: string;
  titleHi: string;
  titleEn: string | null;
  descriptionHi: string | null;
  descriptionEn: string | null;
  discountType: DiscountType;
  discountValue: string; // Decimal
  minOrder: string | null; // Decimal
  maxDiscount: string | null; // Decimal
  validFrom: Date;
  validUntil: Date;
  usageLimit: number | null;
  usageCount: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface OfferService {
  id: string;
  offerId: string;
  serviceId: string;
}

export interface OfferRedemption {
  id: string;
  offerId: string;
  userId: string;
  bookingId: string | null;
  createdAt: Date;
}

export interface LoyaltyTransaction {
  id: string;
  userId: string;
  type: LoyaltyTransactionType;
  points: number;
  bookingId: string | null;
  reason: string;
  createdAt: Date;
}
