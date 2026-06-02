/**
 * Purpose: Booking lifecycle business logic service
 * Responsibility: All booking CRUD operations + status transitions + price calculation + offer validation
 * Important Notes:
 *   - Business logic lives HERE, NOT in route handlers
 *   - Slot availability check reuses slot-service patterns
 *   - bookingDisplayId: "BK-{YYYY}-{NNNNN}" sequential format
 *   - Price snapshot: service/variant/addOn prices snapshotted at booking time
 *   - Status machine: only valid transitions allowed (VALID_TRANSITIONS map)
 *   - Loyalty on complete: 1 point per ₹100 spent
 *   - Staff commission on complete: commissionRate * totalAmount / 100
 *   - Transaction safety: booking creation in Prisma $transaction
 *   - Decimal handling: all money fields as Prisma Decimal, return as numbers
 *   - Hindi-first user-facing messages in errors
 *   - URL-based ID extraction from request.url pathname
 */

import { prisma } from "@/lib/database/prisma";
import { requireAdmin, requireAuth } from "@/lib/server/auth-hooks";
import {
  BookingNotFoundError,
  BookingSlotUnavailableError,
  BookingInvalidStatusTransitionError,
  BookingAlreadyCancelledError,
  BookingCannotCancelError,
  BookingUnauthorizedError,
  BookingOfferInvalidError,
  BookingOfferNotApplicableError,
  BookingOfferLimitReachedError,
  ServiceNotFoundError,
  ServiceVariantNotFoundError,
  BranchNotFoundError,
  StaffNotFoundError,
} from "@/lib/server/errors";
import type {
  BookingDetailResponse,
  BookingListResponse,
  BookingListQuery,
  BookingListItemResponse,
  CreateBookingResult,
  CancelBookingResult,
  StatusTransitionResult,
  BookingStatus,
  BookingAddOnResponse,
  BookingStatusHistoryResponse,
  BookingOfferResponse,
  BookingPaymentResponse,
} from "@/features/booking/types";
import type { CreateBookingInput, CancelBookingInput } from "@/features/booking/validations/booking";
import { Prisma } from "@prisma/client";

// Re-export auth hooks for convenience in route files
export { requireAdmin, requireAuth };

// ==================== CONSTANTS ====================

/** Buffer time between bookings in minutes — for overlap checking */
const BUFFER_MINUTES = 5;

/** Loyalty points earned per ₹100 spent */
const LOYALTY_POINTS_PER_HUNDRED = 1;

// ==================== TIME/DATE HELPERS ====================

/** Convert "HH:mm" string → minutes since midnight */
function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

/** Convert "HH:mm" string → Date object for Prisma @db.Time(0) */
function timeStringToDate(time: string): Date {
  const [hours, minutes] = time.split(":").map(Number);
  return new Date(Date.UTC(1970, 0, 1, hours, minutes, 0));
}

/** Convert Date object → "HH:mm" string from Prisma @db.Time(0) */
function dateToTimeString(date: Date): string {
  const hours = date.getUTCHours().toString().padStart(2, "0");
  const minutes = date.getUTCMinutes().toString().padStart(2, "0");
  return `${hours}:${minutes}`;
}

/** Convert Date object → "YYYY-MM-DD" string from Prisma @db.Date */
function dateToDateString(date: Date): string {
  const year = date.getUTCFullYear().toString();
  const month = (date.getUTCMonth() + 1).toString().padStart(2, "0");
  const day = date.getUTCDate().toString().padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** Parse "YYYY-MM-DD" to a Date object in UTC */
function parseDateString(dateStr: string): Date {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

// ==================== DECIMAL HELPER ====================

/** Convert Prisma Decimal to number for API response */
function decimalToNumber(value: unknown): number {
  if (value === null || value === undefined) return 0;
  return Number(value);
}

/** Convert Prisma Decimal to number or null for API response */
function decimalToNumberOrNull(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  return Number(value);
}

// ==================== URL HELPERS ====================

/**
 * Extract booking ID from URL pathname
 * Works for /api/bookings/[id]/... patterns
 */
export function extractBookingIdFromUrl(url: string): string {
  const pathname = new URL(url).pathname;
  const segments = pathname.split("/").filter(Boolean);
  // /api/bookings/[id] → segments: ['api', 'bookings', 'id']
  return segments[2] || "";
}

// ==================== SLOT AVAILABILITY CHECK ====================

/**
 * Check if a specific slot is available for booking
 * Queries existing non-cancelled/non-no_show bookings for the same staff/date
 * If no staffId provided, checks if ANY staff has a conflict with that slot
 */
async function isSlotAvailable(params: {
  staffId?: string;
  branchId: string;
  bookingDate: string;
  slotStart: string; // "HH:mm"
  slotEnd: string;   // "HH:mm"
  excludeBookingId?: string; // For updates, exclude the booking being modified
}): Promise<boolean> {
  const { staffId, branchId, bookingDate, slotStart, slotEnd, excludeBookingId } = params;

  const dateObj = parseDateString(bookingDate);
  const slotStartDate = timeStringToDate(slotStart);
  const slotEndDate = timeStringToDate(slotEnd);

  // Build where clause for existing bookings
  const where: Prisma.BookingWhereInput = {
    bookingDate: dateObj,
    slotStart: slotStartDate,
    slotEnd: slotEndDate,
    status: { notIn: ["CANCELLED", "NO_SHOW"] },
  };

  if (staffId) {
    where.staffId = staffId;
  }

  if (excludeBookingId) {
    where.id = { not: excludeBookingId };
  }

  // Check for overlapping bookings (same slot start/end or within range)
  // More precise: check for any booking that overlaps the time range
  const conflictingBookings = await findOverlappingBookings({
    staffId,
    branchId,
    bookingDate: dateObj,
    slotStartMinutes: timeToMinutes(slotStart),
    slotEndMinutes: timeToMinutes(slotEnd),
    excludeBookingId,
  });

  return conflictingBookings === 0;
}

/**
 * Find bookings that overlap with a given time slot for a specific staff member
 * Uses the same overlap logic as slot-service: slotStart < bookingEnd + buffer AND slotEnd > bookingStart
 */
async function findOverlappingBookings(params: {
  staffId?: string;
  branchId: string;
  bookingDate: Date;
  slotStartMinutes: number;
  slotEndMinutes: number;
  excludeBookingId?: string;
}): Promise<number> {
  const { staffId, bookingDate, excludeBookingId } = params;

  // Get all non-cancelled bookings for this staff/date
  const where: Prisma.BookingWhereInput = {
    bookingDate,
    status: { notIn: ["CANCELLED", "NO_SHOW"] },
  };

  if (staffId) {
    where.staffId = staffId;
  }

  if (excludeBookingId) {
    where.id = { not: excludeBookingId };
  }

  const bookings = await prisma.booking.findMany({
    where,
    select: {
      slotStart: true,
      slotEnd: true,
    },
  });

  // Check overlap: slotStart < (bookingEnd + buffer) AND slotEnd > bookingStart
  let overlapCount = 0;
  for (const booking of bookings) {
    const bookingStartMinutes = timeToMinutes(dateToTimeString(booking.slotStart));
    const bookingEndMinutes = timeToMinutes(dateToTimeString(booking.slotEnd));

    const effectiveBookingEnd = bookingEndMinutes + BUFFER_MINUTES;
    const overlaps = params.slotStartMinutes < effectiveBookingEnd && params.slotEndMinutes > bookingStartMinutes;

    if (overlaps) {
      overlapCount++;
    }
  }

  return overlapCount;
}

// ==================== BOOKING DISPLAY ID ====================

/**
 * Generate bookingDisplayId: "BK-{YYYY}-{NNNNN}"
 * Sequential number within the year — finds max+1 for the year
 */
async function generateBookingDisplayId(tx: Prisma.TransactionClient): Promise<string> {
  const year = new Date().getFullYear();

  // Find the highest sequential number for this year
  const lastBooking = await tx.booking.findFirst({
    where: {
      bookingDisplayId: { startsWith: `BK-${year}-` },
    },
    orderBy: { bookingDisplayId: "desc" },
    select: { bookingDisplayId: true },
  });

  let nextNumber = 1;
  if (lastBooking) {
    const parts = lastBooking.bookingDisplayId.split("-");
    // BK-2026-00001 → parts: ['BK', '2026', '00001']
    const lastNum = parseInt(parts[2], 10);
    if (!isNaN(lastNum)) {
      nextNumber = lastNum + 1;
    }
  }

  const sequential = nextNumber.toString().padStart(5, "0");
  return `BK-${year}-${sequential}`;
}

// ==================== OFFER VALIDATION ====================

/**
 * Validate and calculate discount for an offer code
 * Returns { offer, discountAmount } or throws appropriate error
 */
async function validateOffer(
  offerCode: string,
  serviceId: string,
  totalBeforeDiscount: Prisma.Decimal
): Promise<{
  offer: { id: string; code: string; titleHi: string; titleEn: string | null; discountType: string; discountValue: Prisma.Decimal; maxDiscount: Prisma.Decimal | null; minOrder: Prisma.Decimal | null };
  discountAmount: Prisma.Decimal;
}> {
  const offer = await prisma.offer.findUnique({
    where: { code: offerCode },
    select: {
      id: true,
      code: true,
      titleHi: true,
      titleEn: true,
      discountType: true,
      discountValue: true,
      maxDiscount: true,
      minOrder: true,
      usageLimit: true,
      usageCount: true,
      isActive: true,
      validFrom: true,
      validUntil: true,
      offerServices: {
        select: { serviceId: true },
      },
    },
  });

  if (!offer || !offer.isActive) {
    throw new BookingOfferInvalidError();
  }

  // Check date validity
  const now = new Date();
  if (now < offer.validFrom || now > offer.validUntil) {
    throw new BookingOfferInvalidError();
  }

  // Check usage limit
  if (offer.usageLimit !== null && offer.usageCount >= offer.usageLimit) {
    throw new BookingOfferLimitReachedError();
  }

  // Check min order
  if (offer.minOrder !== null && totalBeforeDiscount < offer.minOrder) {
    throw new BookingOfferInvalidError();
  }

  // Check if offer is applicable to this service
  // If offer has specific service restrictions, check them
  if (offer.offerServices.length > 0) {
    const isApplicable = offer.offerServices.some((os) => os.serviceId === serviceId);
    if (!isApplicable) {
      throw new BookingOfferNotApplicableError();
    }
  }

  // Calculate discount
  let discountAmount: Prisma.Decimal;
  if (offer.discountType === "PERCENTAGE") {
    discountAmount = totalBeforeDiscount.mul(offer.discountValue).div(100);
  } else {
    // FLAT_AMOUNT
    discountAmount = offer.discountValue;
  }

  // Apply max discount cap
  if (offer.maxDiscount !== null) {
    discountAmount = Prisma.Decimal.min(discountAmount, offer.maxDiscount);
  }

  // Discount cannot exceed total
  discountAmount = Prisma.Decimal.min(discountAmount, totalBeforeDiscount);

  return {
    offer: {
      id: offer.id,
      code: offer.code,
      titleHi: offer.titleHi,
      titleEn: offer.titleEn,
      discountType: offer.discountType,
      discountValue: offer.discountValue,
      maxDiscount: offer.maxDiscount,
      minOrder: offer.minOrder,
    },
    discountAmount,
  };
}

// ==================== CREATE BOOKING ====================

/**
 * Create a new booking
 * Auth: any authenticated user
 * Steps:
 *   1. Validate service exists and is active
 *   2. Validate variant if provided
 *   3. Validate branch exists
 *   4. Validate staff if provided (belongs to branch, can perform service)
 *   5. Check slot availability
 *   6. Calculate price (service/variant + addOns)
 *   7. Validate offer if provided
 *   8. Generate bookingDisplayId
 *   9. Create booking in transaction
 */
export async function createBooking(
  data: CreateBookingInput,
  userId: string
): Promise<CreateBookingResult> {
  // 1. Validate service
  const service = await prisma.service.findUnique({
    where: { id: data.serviceId },
    select: {
      id: true,
      nameHi: true,
      nameEn: true,
      price: true,
      durationMinutes: true,
      isActive: true,
      branchId: true,
    },
  });

  if (!service || !service.isActive) {
    throw new ServiceNotFoundError();
  }

  // 2. Determine effective price and duration
  let servicePrice = service.price;
  let serviceDurationMinutes = service.durationMinutes;

  if (data.variantId) {
    const variant = await prisma.serviceVariant.findUnique({
      where: { id: data.variantId },
      select: { id: true, price: true, durationMinutes: true, serviceId: true, isActive: true },
    });

    if (!variant || !variant.isActive || variant.serviceId !== data.serviceId) {
      throw new ServiceVariantNotFoundError();
    }

    servicePrice = variant.price;
    serviceDurationMinutes = variant.durationMinutes;
  }

  // 3. Validate branch
  const branch = await prisma.branch.findUnique({
    where: { id: data.branchId },
    select: { id: true, isActive: true },
  });

  if (!branch || !branch.isActive) {
    throw new BranchNotFoundError();
  }

  // 4. Validate staff if provided
  if (data.staffId) {
    const staff = await prisma.staff.findFirst({
      where: { id: data.staffId, branchId: data.branchId, isAvailable: true },
    });

    if (!staff) {
      throw new StaffNotFoundError();
    }

    // Check staff can perform this service
    const staffService = await prisma.staffService.findFirst({
      where: { staffId: data.staffId, serviceId: data.serviceId },
    });

    if (!staffService) {
      throw new StaffNotFoundError();
    }
  }

  // 5. Calculate slotEnd from slotStart + duration
  const slotStartMinutes = timeToMinutes(data.slotStart);
  const slotEndMinutes = slotStartMinutes + serviceDurationMinutes;
  const slotEnd = `${Math.floor(slotEndMinutes / 60).toString().padStart(2, "0")}:${(slotEndMinutes % 60).toString().padStart(2, "0")}`;

  // 6. Check slot availability
  const isAvailable = await isSlotAvailable({
    staffId: data.staffId,
    branchId: data.branchId,
    bookingDate: data.bookingDate,
    slotStart: data.slotStart,
    slotEnd,
  });

  if (!isAvailable) {
    throw new BookingSlotUnavailableError();
  }

  // 7. Get addOn prices for snapshot
  let addOnsTotal = new Prisma.Decimal(0);
  const addOnSnapshots: Array<{ addOnId: string | null; name: string; price: Prisma.Decimal }> = [];

  if (data.addOnIds && data.addOnIds.length > 0) {
    const addOns = await prisma.serviceAddOn.findMany({
      where: {
        id: { in: data.addOnIds },
        serviceId: data.serviceId,
        isActive: true,
      },
      select: {
        id: true,
        nameHi: true,
        nameEn: true,
        price: true,
      },
    });

    if (addOns.length !== data.addOnIds.length) {
      throw new ServiceNotFoundError(); // Some add-ons not found
    }

    for (const addOn of addOns) {
      addOnSnapshots.push({
        addOnId: addOn.id,
        name: addOn.nameHi || addOn.nameEn,
        price: addOn.price,
      });
      addOnsTotal = addOnsTotal.add(addOn.price);
    }
  }

  // 8. Calculate total before discount
  const totalBeforeDiscount = servicePrice.add(addOnsTotal);

  // 9. Validate offer if provided
  let offerResult: Awaited<ReturnType<typeof validateOffer>> | null = null;
  if (data.offerCode) {
    offerResult = await validateOffer(data.offerCode, data.serviceId, totalBeforeDiscount);
  }

  const discountAmount = offerResult?.discountAmount ?? new Prisma.Decimal(0);
  const totalAmount = totalBeforeDiscount.sub(discountAmount);

  // 10. Create booking in transaction
  const booking = await prisma.$transaction(async (tx) => {
    // Generate display ID within transaction for atomicity
    const bookingDisplayId = await generateBookingDisplayId(tx);

    // Create the booking
    const newBooking = await tx.booking.create({
      data: {
        bookingDisplayId,
        userId,
        serviceId: data.serviceId,
        variantId: data.variantId || null,
        staffId: data.staffId || null,
        branchId: data.branchId,
        bookingDate: parseDateString(data.bookingDate),
        slotStart: timeStringToDate(data.slotStart),
        slotEnd: timeStringToDate(slotEnd),
        status: "PENDING",
        totalAmount,
        notes: data.notes || null,
      },
    });

    // Create booking add-ons (snapshot)
    if (addOnSnapshots.length > 0) {
      await tx.bookingAddOn.createMany({
        data: addOnSnapshots.map((ao) => ({
          bookingId: newBooking.id,
          addOnId: ao.addOnId,
          name: ao.name,
          price: ao.price,
        })),
      });
    }

    // Create initial status history
    await tx.bookingStatusHistory.create({
      data: {
        bookingId: newBooking.id,
        status: "PENDING",
        changedBy: userId,
        reason: "बुकिंग बनाई गई / Booking created",
      },
    });

    // If offer code provided, create booking offer and increment usage
    if (offerResult) {
      await tx.bookingOffer.create({
        data: {
          bookingId: newBooking.id,
          offerId: offerResult.offer.id,
        },
      });

      await tx.offer.update({
        where: { id: offerResult.offer.id },
        data: { usageCount: { increment: 1 } },
      });
    }

    return newBooking;
  });

  return {
    id: booking.id,
    bookingDisplayId: booking.bookingDisplayId,
    status: booking.status as BookingStatus,
    totalAmount: decimalToNumber(booking.totalAmount),
    discountAmount: decimalToNumber(discountAmount),
    advanceAmount: decimalToNumberOrNull(booking.advanceAmount),
    createdAt: booking.createdAt.toISOString(),
  };
}

// ==================== LIST BOOKINGS ====================

/**
 * List bookings with filtering and pagination
 * For USER: their own bookings only
 * For ADMIN/STAFF: all bookings with filters
 */
export async function listBookings(
  query: BookingListQuery,
  userId: string,
  userRole: string
): Promise<BookingListResponse> {
  const { status, branchId, date, page = 1, limit = 20 } = query;

  const where: Prisma.BookingWhereInput = {};

  // Non-admin users can only see their own bookings
  if (userRole === "USER") {
    where.userId = userId;
  } else if (query.userId) {
    where.userId = query.userId;
  }

  // Apply filters
  if (status) {
    where.status = status;
  }
  if (branchId) {
    where.branchId = branchId;
  }
  if (date) {
    where.bookingDate = parseDateString(date);
  }

  // Pagination
  const skip = (page - 1) * limit;
  const take = limit;

  const [bookings, total] = await Promise.all([
    prisma.booking.findMany({
      where,
      orderBy: [{ bookingDate: "desc" }, { slotStart: "asc" }],
      skip,
      take,
      include: {
        service: { select: { nameHi: true, nameEn: true } },
        variant: { select: { nameHi: true, nameEn: true } },
        staff: { include: { user: { select: { name: true } } } },
        branch: { select: { nameHi: true, nameEn: true } },
        user: { select: { name: true } },
      },
    }),
    prisma.booking.count({ where }),
  ]);

  const bookingItems: BookingListItemResponse[] = bookings.map((b) => ({
    id: b.id,
    bookingDisplayId: b.bookingDisplayId,
    userId: b.userId,
    userName: b.user.name,
    serviceId: b.serviceId,
    serviceNameHi: b.service.nameHi,
    serviceNameEn: b.service.nameEn,
    variantNameHi: b.variant?.nameHi ?? null,
    variantNameEn: b.variant?.nameEn ?? null,
    staffId: b.staffId,
    staffName: b.staff?.user?.name ?? null,
    branchId: b.branchId,
    branchNameHi: b.branch.nameHi,
    branchNameEn: b.branch.nameEn,
    bookingDate: dateToDateString(b.bookingDate),
    slotStart: dateToTimeString(b.slotStart),
    slotEnd: dateToTimeString(b.slotEnd),
    status: b.status as BookingStatus,
    advanceAmount: decimalToNumberOrNull(b.advanceAmount),
    totalAmount: decimalToNumber(b.totalAmount),
    createdAt: b.createdAt.toISOString(),
  }));

  return {
    bookings: bookingItems,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

// ==================== GET BOOKING DETAIL ====================

/**
 * Get full booking detail with all relations
 * Auth: own booking or ADMIN/STAFF
 */
export async function getBookingDetail(
  bookingId: string,
  userId: string,
  userRole: string
): Promise<BookingDetailResponse> {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      service: { select: { nameHi: true, nameEn: true } },
      variant: { select: { nameHi: true, nameEn: true } },
      staff: { include: { user: { select: { name: true } } } },
      branch: { select: { nameHi: true, nameEn: true } },
      user: { select: { name: true } },
      addOns: { select: { id: true, addOnId: true, name: true, price: true } },
      statusHistory: {
        orderBy: { createdAt: "asc" },
        select: { id: true, status: true, changedBy: true, reason: true, createdAt: true },
      },
      payments: {
        select: { id: true, amount: true, provider: true, status: true, paidAt: true },
      },
      bookingOffers: {
        include: {
          offer: {
            select: {
              id: true,
              code: true,
              titleHi: true,
              titleEn: true,
              discountType: true,
              discountValue: true,
            },
          },
        },
      },
    },
  });

  if (!booking) {
    throw new BookingNotFoundError();
  }

  // Authorization check
  if (userRole === "USER" && booking.userId !== userId) {
    throw new BookingUnauthorizedError();
  }

  // Calculate discount amount from offers
  let discountAmount = 0;
  const offers: BookingOfferResponse[] = [];
  for (const bo of booking.bookingOffers) {
    const offerDiscount = calculateOfferDiscount(
      bo.offer.discountType,
      bo.offer.discountValue,
      booking.totalAmount
    );
    discountAmount += offerDiscount;
    offers.push({
      offerId: bo.offer.id,
      code: bo.offer.code,
      titleHi: bo.offer.titleHi,
      titleEn: bo.offer.titleEn,
      discountType: bo.offer.discountType as "PERCENTAGE" | "FLAT_AMOUNT",
      discountValue: decimalToNumber(bo.offer.discountValue),
    });
  }

  const addOns: BookingAddOnResponse[] = booking.addOns.map((ao) => ({
    id: ao.id,
    addOnId: ao.addOnId,
    name: ao.name,
    price: decimalToNumber(ao.price),
  }));

  const statusHistory: BookingStatusHistoryResponse[] = booking.statusHistory.map((sh) => ({
    id: sh.id,
    status: sh.status as BookingStatus,
    changedBy: sh.changedBy,
    reason: sh.reason,
    createdAt: sh.createdAt.toISOString(),
  }));

  const payments: BookingPaymentResponse[] = booking.payments.map((p) => ({
    id: p.id,
    amount: decimalToNumber(p.amount),
    provider: p.provider,
    status: p.status,
    paidAt: p.paidAt?.toISOString() ?? null,
  }));

  return {
    id: booking.id,
    bookingDisplayId: booking.bookingDisplayId,
    userId: booking.userId,
    serviceId: booking.serviceId,
    serviceNameHi: booking.service.nameHi,
    serviceNameEn: booking.service.nameEn,
    variantId: booking.variantId,
    variantNameHi: booking.variant?.nameHi ?? null,
    variantNameEn: booking.variant?.nameEn ?? null,
    staffId: booking.staffId,
    staffName: booking.staff?.user?.name ?? null,
    branchId: booking.branchId,
    branchNameHi: booking.branch.nameHi,
    branchNameEn: booking.branch.nameEn,
    bookingDate: dateToDateString(booking.bookingDate),
    slotStart: dateToTimeString(booking.slotStart),
    slotEnd: dateToTimeString(booking.slotEnd),
    status: booking.status as BookingStatus,
    advanceAmount: decimalToNumberOrNull(booking.advanceAmount),
    totalAmount: decimalToNumber(booking.totalAmount),
    discountAmount,
    cancellationReason: booking.cancellationReason,
    notes: booking.notes,
    addOns,
    statusHistory,
    payments,
    offers,
    createdAt: booking.createdAt.toISOString(),
    updatedAt: booking.updatedAt.toISOString(),
  };
}

/** Calculate discount amount from offer for display purposes */
function calculateOfferDiscount(
  discountType: string,
  discountValue: Prisma.Decimal,
  totalAmount: Prisma.Decimal
): number {
  if (discountType === "PERCENTAGE") {
    return decimalToNumber(totalAmount.mul(discountValue).div(100));
  }
  return decimalToNumber(Prisma.Decimal.min(discountValue, totalAmount));
}

// ==================== STATUS TRANSITION HELPERS ====================

/**
 * Validate and perform a booking status transition
 * Shared logic for confirm, start, complete, cancel, no-show
 */
async function transitionStatus(params: {
  bookingId: string;
  newStatus: BookingStatus;
  changedBy: string;
  reason?: string;
  userId: string;
  userRole: string;
  /** Additional authorization check — returns true if allowed */
  authCheck?: (booking: { userId: string; staffId: string | null }, userId: string, userRole: string) => boolean;
}): Promise<StatusTransitionResult> {
  const { bookingId, newStatus, changedBy, reason, userId, userRole, authCheck } = params;

  // Get current booking
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    select: {
      id: true,
      bookingDisplayId: true,
      status: true,
      userId: true,
      staffId: true,
      totalAmount: true,
    },
  });

  if (!booking) {
    throw new BookingNotFoundError();
  }

  // Authorization check
  if (authCheck) {
    if (!authCheck(booking, userId, userRole)) {
      throw new BookingUnauthorizedError();
    }
  }

  const currentStatus = booking.status as BookingStatus;

  // Validate status transition
  const validTransitions: Record<BookingStatus, BookingStatus[]> = {
    PENDING: ["CONFIRMED", "CANCELLED"],
    CONFIRMED: ["IN_PROGRESS", "CANCELLED", "NO_SHOW"],
    IN_PROGRESS: ["COMPLETED"],
    COMPLETED: [],
    CANCELLED: [],
    NO_SHOW: [],
  };

  if (!validTransitions[currentStatus].includes(newStatus)) {
    throw new BookingInvalidStatusTransitionError(currentStatus, newStatus);
  }

  // Perform transition in transaction
  const updated = await prisma.$transaction(async (tx) => {
    // Update booking status
    const updatedBooking = await tx.booking.update({
      where: { id: bookingId },
      data: { status: newStatus },
    });

    // Create status history entry
    await tx.bookingStatusHistory.create({
      data: {
        bookingId,
        status: newStatus,
        changedBy,
        reason: reason || null,
      },
    });

    return updatedBooking;
  });

  return {
    id: updated.id,
    bookingDisplayId: updated.bookingDisplayId,
    previousStatus: currentStatus,
    newStatus,
  };
}

// ==================== CONFIRM BOOKING ====================

/**
 * Confirm a PENDING booking
 * Auth: ADMIN only
 * Status: PENDING → CONFIRMED
 */
export async function confirmBooking(
  bookingId: string,
  changedBy: string
): Promise<StatusTransitionResult> {
  return transitionStatus({
    bookingId,
    newStatus: "CONFIRMED",
    changedBy,
    userId: changedBy,
    userRole: "ADMIN",
    authCheck: () => true, // Admin only check done at route level
  });
}

// ==================== START BOOKING ====================

/**
 * Start a CONFIRMED booking (service begins)
 * Auth: ADMIN or STAFF (assigned to this booking)
 * Status: CONFIRMED → IN_PROGRESS
 */
export async function startBooking(
  bookingId: string,
  userId: string,
  userRole: string
): Promise<StatusTransitionResult> {
  return transitionStatus({
    bookingId,
    newStatus: "IN_PROGRESS",
    changedBy: userId,
    userId,
    userRole,
    authCheck: (booking, uid, role) => {
      // Admin can start any booking
      if (role === "ADMIN") return true;
      // Staff can only start bookings assigned to them
      if (role === "STAFF") return booking.staffId !== null;
      return false;
    },
  });
}

// ==================== COMPLETE BOOKING ====================

/**
 * Complete an IN_PROGRESS booking
 * Auth: ADMIN or STAFF (assigned to this booking)
 * Status: IN_PROGRESS → COMPLETED
 * Side effects: Calculate staff commission, add loyalty points
 */
export async function completeBooking(
  bookingId: string,
  userId: string,
  userRole: string
): Promise<StatusTransitionResult> {
  // Get booking details for post-completion side effects
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    select: {
      id: true,
      bookingDisplayId: true,
      status: true,
      userId: true,
      staffId: true,
      totalAmount: true,
    },
  });

  if (!booking) {
    throw new BookingNotFoundError();
  }

  // Authorization check
  if (userRole === "USER") {
    throw new BookingUnauthorizedError();
  }
  if (userRole === "STAFF" && !booking.staffId) {
    throw new BookingUnauthorizedError();
  }

  const currentStatus = booking.status as BookingStatus;

  // Validate transition
  const validTransitions: Record<BookingStatus, BookingStatus[]> = {
    PENDING: ["CONFIRMED", "CANCELLED"],
    CONFIRMED: ["IN_PROGRESS", "CANCELLED", "NO_SHOW"],
    IN_PROGRESS: ["COMPLETED"],
    COMPLETED: [],
    CANCELLED: [],
    NO_SHOW: [],
  };

  if (!validTransitions[currentStatus].includes("COMPLETED")) {
    throw new BookingInvalidStatusTransitionError(currentStatus, "COMPLETED");
  }

  // Perform transition + side effects in transaction
  const result = await prisma.$transaction(async (tx) => {
    // Update booking status
    const updatedBooking = await tx.booking.update({
      where: { id: bookingId },
      data: { status: "COMPLETED" },
    });

    // Create status history
    await tx.bookingStatusHistory.create({
      data: {
        bookingId,
        status: "COMPLETED",
        changedBy: userId,
        reason: "सेवा पूरी हुई / Service completed",
      },
    });

    // Side effect 1: Add loyalty points to user (1 point per ₹100 spent)
    const totalAmount = decimalToNumber(booking.totalAmount);
    const loyaltyPoints = Math.floor(totalAmount / 100) * LOYALTY_POINTS_PER_HUNDRED;

    if (loyaltyPoints > 0) {
      // Create loyalty transaction
      await tx.loyaltyTransaction.create({
        data: {
          userId: booking.userId,
          type: "EARN",
          points: loyaltyPoints,
          bookingId,
          reason: `बुकिंग पूरी हुई — ${loyaltyPoints} अंक अर्जित / Booking completed — ${loyaltyPoints} points earned`,
        },
      });

      // Update user's loyalty points
      await tx.user.update({
        where: { id: booking.userId },
        data: { loyaltyPoints: { increment: loyaltyPoints } },
      });
    }

    // Side effect 2: Calculate and create staff commission
    if (booking.staffId) {
      const staff = await tx.staff.findUnique({
        where: { id: booking.staffId },
        select: { commissionRate: true },
      });

      if (staff?.commissionRate) {
        const commissionRate = decimalToNumber(staff.commissionRate);
        const commissionAmount = new Prisma.Decimal(totalAmount)
          .mul(commissionRate)
          .div(100);

        await tx.staffCommission.create({
          data: {
            staffId: booking.staffId,
            bookingId,
            amount: commissionAmount,
            rate: staff.commissionRate,
            status: "PENDING",
          },
        });
      }
    }

    return {
      id: updatedBooking.id,
      bookingDisplayId: updatedBooking.bookingDisplayId,
      previousStatus: currentStatus,
      newStatus: "COMPLETED" as BookingStatus,
    };
  });

  return result;
}

// ==================== CANCEL BOOKING ====================

/**
 * Cancel a booking
 * Auth: USER (own booking) or ADMIN
 * Status: PENDING/CONFIRMED → CANCELLED
 */
export async function cancelBooking(
  bookingId: string,
  data: CancelBookingInput,
  userId: string,
  userRole: string
): Promise<CancelBookingResult> {
  // Get current booking
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    select: {
      id: true,
      bookingDisplayId: true,
      status: true,
      userId: true,
    },
  });

  if (!booking) {
    throw new BookingNotFoundError();
  }

  // Authorization check
  if (userRole === "USER" && booking.userId !== userId) {
    throw new BookingUnauthorizedError();
  }

  const currentStatus = booking.status as BookingStatus;

  // Check if already cancelled
  if (currentStatus === "CANCELLED") {
    throw new BookingAlreadyCancelledError();
  }

  // Check if booking can be cancelled (only PENDING or CONFIRMED)
  if (currentStatus !== "PENDING" && currentStatus !== "CONFIRMED") {
    throw new BookingCannotCancelError();
  }

  // Perform cancellation
  const updated = await prisma.$transaction(async (tx) => {
    // Update booking
    const updatedBooking = await tx.booking.update({
      where: { id: bookingId },
      data: {
        status: "CANCELLED",
        cancellationReason: data.cancellationReason,
      },
    });

    // Create status history
    await tx.bookingStatusHistory.create({
      data: {
        bookingId,
        status: "CANCELLED",
        changedBy: userId,
        reason: data.cancellationReason,
      },
    });

    return updatedBooking;
  });

  return {
    id: updated.id,
    bookingDisplayId: updated.bookingDisplayId,
    status: "CANCELLED" as BookingStatus,
    cancellationReason: updated.cancellationReason,
  };
}

// ==================== MARK NO-SHOW ====================

/**
 * Mark a booking as no-show
 * Auth: ADMIN only
 * Status: CONFIRMED → NO_SHOW
 */
export async function markNoShow(
  bookingId: string,
  changedBy: string
): Promise<StatusTransitionResult> {
  return transitionStatus({
    bookingId,
    newStatus: "NO_SHOW",
    changedBy,
    userId: changedBy,
    userRole: "ADMIN",
    authCheck: () => true, // Admin only check done at route level
  });
}
