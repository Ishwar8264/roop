/**
 * Purpose: Booking domain types
 * Responsibility: Types matching Booking, BookingAddOn, BookingStatusHistory,
 *                BookingOffer, Consultation, Review, CustomerAddress Prisma models
 */

import type { BookingStatus, ConsultationStatus } from "./enums";

export interface Booking {
  id: string;
  bookingDisplayId: string;
  userId: string;
  serviceId: string;
  variantId: string | null;
  staffId: string | null;
  branchId: string;
  bookingDate: string; // Date — "2026-05-30"
  slotStart: string; // Time(0) — "11:00"
  slotEnd: string; // Time(0) — "12:00"
  status: BookingStatus;
  advanceAmount: string | null; // Decimal
  totalAmount: string; // Decimal
  cancellationReason: string | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface BookingAddOn {
  id: string;
  bookingId: string;
  addOnId: string | null;
  variantId: string | null;
  name: string;
  price: string; // Decimal
  createdAt: Date;
}

export interface BookingStatusHistory {
  id: string;
  bookingId: string;
  status: BookingStatus;
  changedBy: string | null;
  reason: string | null;
  createdAt: Date;
}

export interface BookingOffer {
  id: string;
  bookingId: string;
  offerId: string;
  createdAt: Date;
}

export interface Consultation {
  id: string;
  userId: string;
  bookingId: string | null;
  staffId: string | null;
  branchId: string;
  date: string; // Date
  time: string; // Time(0)
  status: ConsultationStatus;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Review {
  id: string;
  userId: string;
  bookingId: string;
  staffId: string | null;
  serviceId: string;
  rating: number;
  commentHi: string | null;
  commentEn: string | null;
  isApproved: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CustomerAddress {
  id: string;
  userId: string;
  label: string;
  address: string;
  city: string;
  pincode: string;
  landmark: string | null;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/** Time slot for booking availability */
export interface TimeSlot {
  start: string;
  end: string;
  available: boolean;
}
