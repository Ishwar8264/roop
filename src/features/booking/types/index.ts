/**
 * Purpose: Booking feature types — shared across service, routes, and client
 * Responsibility: Type definitions for slot availability + booking lifecycle APIs
 * Important Notes:
 *   - These are API response types — never expose raw Prisma models
 *   - Time fields returned as "HH:mm" strings for frontend convenience
 *   - Date fields returned as "YYYY-MM-DD" strings
 *   - All monetary values returned as numbers (converted from Prisma Decimal)
 */

// ==================== SLOT AVAILABILITY ====================

/** Staff info within an available slot */
export interface AvailableStaffInfo {
  staffId: string;
  name: string;    // Hindi name (preferred)
  nameEn: string;  // English name
}

/** Single time slot with availability info */
export interface SlotItem {
  startTime: string;            // "09:00"
  endTime: string;              // "09:45" (startTime + durationMinutes)
  isAvailable: boolean;
  availableStaff: AvailableStaffInfo[];
}

/** Response for GET /api/branches/[id]/slots and GET /api/staff/[id]/slots */
export interface SlotAvailabilityResponse {
  date: string;                    // "2026-06-15"
  branchId: string;
  serviceId: string;
  variantId?: string | null;
  staffId?: string | null;
  isHoliday: boolean;
  holidayReason: string | null;    // Hindi reason if holiday
  openTime: string;                // Effective open time "09:00"
  closeTime: string;               // Effective close time "20:00"
  slotDuration: number;            // Service duration in minutes
  slotStep: number;                // Step between slots (30 min default)
  bufferMinutes: number;           // Buffer between bookings (5 min default)
  slots: SlotItem[];
}

// ==================== QUERY / FILTER TYPES ====================

/** Query params for GET /api/branches/[id]/slots */
export interface BranchSlotQuery {
  date: string;         // "YYYY-MM-DD" — REQUIRED
  serviceId: string;    // REQUIRED — need duration for slot calculation
  variantId?: string;   // Optional — use variant duration instead
  staffId?: string;     // Optional — filter for specific staff member
}

/** Query params for GET /api/staff/[id]/slots */
export interface StaffSlotQuery {
  date: string;         // "YYYY-MM-DD" — REQUIRED
  serviceId: string;    // REQUIRED — need duration for slot calculation
  variantId?: string;   // Optional — use variant duration instead
}

// ==================== INTERNAL CALCULATION TYPES ====================

/** Internal type for time in minutes since midnight */
export type MinutesSinceMidnight = number;

/** Internal booking record for overlap checking */
export interface BookingOverlapInfo {
  staffId: string;
  slotStart: MinutesSinceMidnight;
  slotEnd: MinutesSinceMidnight;
  status: string;  // BookingStatus — only non-cancelled bookings block slots
}

/** Internal staff schedule info for slot calculation */
export interface StaffScheduleInfo {
  staffId: string;
  name: string;      // Hindi name
  nameEn: string;    // English name
  workStart: MinutesSinceMidnight;
  workEnd: MinutesSinceMidnight;
  workDays: {
    mon: boolean;
    tue: boolean;
    wed: boolean;
    thu: boolean;
    fri: boolean;
    sat: boolean;
    sun: boolean;
  };
  isAvailable: boolean;
  hasLeave: boolean;
}

// ==================== BOOKING LIFECYCLE ====================

/** Booking status enum — mirrors Prisma BookingStatus */
export type BookingStatus = "PENDING" | "CONFIRMED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED" | "NO_SHOW";

/** Valid status transitions map */
const _VALID_TRANSITIONS: Record<BookingStatus, BookingStatus[]> = {
  PENDING: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["IN_PROGRESS", "CANCELLED", "NO_SHOW"],
  IN_PROGRESS: ["COMPLETED"],
  COMPLETED: [],
  CANCELLED: [],
  NO_SHOW: [],
};

/** Terminal statuses — no further transitions allowed */
const _TERMINAL_STATUSES: BookingStatus[] = ["COMPLETED", "CANCELLED", "NO_SHOW"];

/** Add-on snapshot in booking response */
export interface BookingAddOnResponse {
  id: string;
  addOnId: string | null;
  name: string;
  price: number; // Snapshot price at time of booking
}

/** Status history entry in booking response */
export interface BookingStatusHistoryResponse {
  id: string;
  status: BookingStatus;
  changedBy: string | null;
  reason: string | null;
  createdAt: string; // ISO string
}

/** Offer info in booking response */
export interface BookingOfferResponse {
  offerId: string;
  code: string;
  titleHi: string;
  titleEn: string | null;
  discountType: "PERCENTAGE" | "FLAT_AMOUNT";
  discountValue: number;
}

/** Payment info in booking response */
export interface BookingPaymentResponse {
  id: string;
  amount: number;
  provider: string;
  status: string;
  paidAt: string | null;
}

/** Booking response — full detail (GET /api/bookings/[id]) */
export interface BookingDetailResponse {
  id: string;
  bookingDisplayId: string;
  userId: string;
  serviceId: string;
  serviceNameHi: string;
  serviceNameEn: string;
  variantId: string | null;
  variantNameHi: string | null;
  variantNameEn: string | null;
  staffId: string | null;
  staffName: string | null;
  branchId: string;
  branchNameHi: string;
  branchNameEn: string;
  bookingDate: string;        // "YYYY-MM-DD"
  slotStart: string;          // "HH:mm"
  slotEnd: string;            // "HH:mm"
  status: BookingStatus;
  advanceAmount: number | null;
  totalAmount: number;
  discountAmount: number;
  cancellationReason: string | null;
  notes: string | null;
  addOns: BookingAddOnResponse[];
  statusHistory: BookingStatusHistoryResponse[];
  payments: BookingPaymentResponse[];
  offers: BookingOfferResponse[];
  createdAt: string;          // ISO string
  updatedAt: string;          // ISO string
}

/** Booking list item (GET /api/bookings) */
export interface BookingListItemResponse {
  id: string;
  bookingDisplayId: string;
  userId: string;
  userName: string | null;
  serviceId: string;
  serviceNameHi: string;
  serviceNameEn: string;
  variantNameHi: string | null;
  variantNameEn: string | null;
  staffId: string | null;
  staffName: string | null;
  branchId: string;
  branchNameHi: string;
  branchNameEn: string;
  bookingDate: string;        // "YYYY-MM-DD"
  slotStart: string;          // "HH:mm"
  slotEnd: string;            // "HH:mm"
  status: BookingStatus;
  advanceAmount: number | null;
  totalAmount: number;
  createdAt: string;          // ISO string
}

/** Paginated booking list response */
export interface BookingListResponse {
  bookings: BookingListItemResponse[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/** Query params for GET /api/bookings */
export interface BookingListQuery {
  status?: BookingStatus;
  branchId?: string;
  date?: string;           // "YYYY-MM-DD"
  userId?: string;
  page?: number;
  limit?: number;
}

/** Create booking result */
export interface CreateBookingResult {
  id: string;
  bookingDisplayId: string;
  status: BookingStatus;
  totalAmount: number;
  discountAmount: number;
  advanceAmount: number | null;
  createdAt: string;
}

/** Cancel booking result */
export interface CancelBookingResult {
  id: string;
  bookingDisplayId: string;
  status: BookingStatus;
  cancellationReason: string | null;
}

/** Status transition result */
export interface StatusTransitionResult {
  id: string;
  bookingDisplayId: string;
  previousStatus: BookingStatus;
  newStatus: BookingStatus;
}
