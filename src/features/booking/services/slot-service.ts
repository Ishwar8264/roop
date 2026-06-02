/**
 * Purpose: Slot availability calculation service
 * Responsibility: All slot calculation logic — branch slots, staff slots, overlap detection
 * Important Notes:
 *   - This is the MOST CRITICAL service for the booking flow
 *   - Business logic lives HERE, NOT in route handlers
 *   - Time handling: "HH:mm" strings ↔ minutes-since-midnight for calculations
 *   - IST timezone: All time comparisons use IST (UTC+5:30)
 *   - Buffer time: 5 min between bookings for cleanup/prep
 *   - Slot step: 30 min intervals (configurable)
 *   - Only non-cancelled bookings block slots
 *   - Hindi-first user-facing messages in errors
 *   - URL-based ID extraction from request.url pathname
 */

import { prisma } from "@/lib/database/prisma";
import {
  BranchNotFoundError,
  ServiceNotFoundError,
  StaffNotFoundError,
  SlotInvalidDateError,
  SlotBranchClosedError,
  SlotServiceRequiredError,
  SlotNoStaffAvailableError,
  ServiceVariantNotFoundError,
} from "@/lib/server/errors";
import type {
  SlotAvailabilityResponse,
  SlotItem,
  AvailableStaffInfo,
  MinutesSinceMidnight,
  BookingOverlapInfo,
  StaffScheduleInfo,
} from "@/features/booking/types";
import type { WorkDays } from "@/features/staff/types";

// ==================== CONSTANTS ====================

/** Slot step interval in minutes — standard for beauty parlours */
const SLOT_STEP_MINUTES = 30;

/** Buffer time between bookings in minutes — for cleanup/prep */
const BUFFER_MINUTES = 5;

/** Max days ahead for slot lookup */
const MAX_DAYS_AHEAD = 30;

/** IST offset in minutes (UTC+5:30) */
const IST_OFFSET_MINUTES = 330; // 5 * 60 + 30

/** Booking statuses that DO NOT block slots */
const NON_BLOCKING_STATUSES = new Set(["CANCELLED", "NO_SHOW"]);

/** Day-of-week key mapping: 0=Sun, 1=Mon, ..., 6=Sat (JS Date.getDay()) */
const DAY_KEY_MAP: Record<number, keyof WorkDays> = {
  0: "sun",
  1: "mon",
  2: "tue",
  3: "wed",
  4: "thu",
  5: "fri",
  6: "sat",
};

// ==================== URL HELPERS ====================

/**
 * Extract branch ID from URL pathname
 * Works for /api/branches/[id]/slots patterns
 */
export function extractBranchIdFromUrl(url: string): string {
  const pathname = new URL(url).pathname;
  const segments = pathname.split("/").filter(Boolean);
  // /api/branches/[id]/slots → segments: ['api', 'branches', 'id', 'slots']
  return segments[2] || "";
}

/**
 * Extract staff ID from URL pathname
 * Works for /api/staff/[id]/slots patterns
 */
export function extractStaffIdFromUrl(url: string): string {
  const pathname = new URL(url).pathname;
  const segments = pathname.split("/").filter(Boolean);
  // /api/staff/[id]/slots → segments: ['api', 'staff', 'id', 'slots']
  return segments[2] || "";
}

// ==================== TIME HELPERS ====================

/** Convert "HH:mm" string → minutes since midnight */
function timeToMinutes(time: string): MinutesSinceMidnight {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

/** Convert minutes since midnight → "HH:mm" string */
function minutesToTime(minutes: MinutesSinceMidnight): string {
  const hours = Math.floor(minutes / 60).toString().padStart(2, "0");
  const mins = (minutes % 60).toString().padStart(2, "0");
  return `${hours}:${mins}`;
}

/** Convert Date object → "HH:mm" string from Prisma @db.Time(0) */
function dateToTimeString(date: Date): string {
  const hours = date.getUTCHours().toString().padStart(2, "0");
  const minutes = date.getUTCMinutes().toString().padStart(2, "0");
  return `${hours}:${minutes}`;
}

/** Get current IST time as minutes since midnight */
function getCurrentISTMinutes(): MinutesSinceMidnight {
  const now = new Date();
  const utcMinutes = now.getUTCHours() * 60 + now.getUTCMinutes();
  return (utcMinutes + IST_OFFSET_MINUTES) % 1440; // 1440 = 24 * 60
}

/** Get current IST date as "YYYY-MM-DD" string */
function getCurrentISTDate(): string {
  const now = new Date();
  const istOffset = IST_OFFSET_MINUTES * 60 * 1000;
  const istTime = new Date(now.getTime() + istOffset);
  const year = istTime.getUTCFullYear().toString();
  const month = (istTime.getUTCMonth() + 1).toString().padStart(2, "0");
  const day = istTime.getUTCDate().toString().padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** Parse "YYYY-MM-DD" to a Date object in UTC */
function parseDateString(dateStr: string): Date {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

/** Get day of week key for a given date string */
function getDayKey(dateStr: string): keyof WorkDays {
  const date = parseDateString(dateStr);
  return DAY_KEY_MAP[date.getUTCDay()];
}

// ==================== DATE VALIDATION ====================

/**
 * Validate date is not in the past and not too far ahead
 * Uses IST timezone for comparison
 */
function validateDate(dateStr: string): void {
  const currentISTDate = getCurrentISTDate();

  // Check if date is before today
  if (dateStr < currentISTDate) {
    throw new SlotInvalidDateError("बीती हुई तारीख। कृपया आज या भविष्य की तारीख चुनें। / Date is in the past. Please select today or a future date.");
  }

  // Check if date is too far ahead
  const maxDate = new Date(parseDateString(currentISTDate));
  maxDate.setUTCDate(maxDate.getUTCDate() + MAX_DAYS_AHEAD);
  const maxDateStr = `${maxDate.getUTCFullYear()}-${(maxDate.getUTCMonth() + 1).toString().padStart(2, "0")}-${maxDate.getUTCDate().toString().padStart(2, "0")}`;

  if (dateStr > maxDateStr) {
    throw new SlotInvalidDateError(`तारीख ${MAX_DAYS_AHEAD} दिनों से अधिक आगे नहीं होनी चाहिए। / Date must not be more than ${MAX_DAYS_AHEAD} days ahead.`);
  }
}

// ==================== SLOT GENERATION ====================

/**
 * Generate time slots within working hours
 * Each slot starts at step intervals, with duration = serviceDurationMinutes
 * A slot is valid if startTime + duration <= closeTimeMinutes
 */
function generateTimeSlots(
  openMinutes: MinutesSinceMidnight,
  closeMinutes: MinutesSinceMidnight,
  serviceDurationMinutes: number,
  stepMinutes: number = SLOT_STEP_MINUTES,
  currentISTMinutes?: MinutesSinceMidnight
): Array<{ startTime: MinutesSinceMidnight; endTime: MinutesSinceMidnight }> {
  const slots: Array<{ startTime: MinutesSinceMidnight; endTime: MinutesSinceMidnight }> = [];

  let slotStart = openMinutes;

  while (slotStart + serviceDurationMinutes <= closeMinutes) {
    // Filter out past time slots if date is today
    // currentISTMinutes is only provided for today's date
    if (currentISTMinutes !== undefined && slotStart <= currentISTMinutes) {
      slotStart += stepMinutes;
      continue;
    }

    const slotEnd = slotStart + serviceDurationMinutes;
    slots.push({ startTime: slotStart, endTime: slotEnd });

    slotStart += stepMinutes;
  }

  return slots;
}

/**
 * Check if a slot overlaps with a booking
 * Overlap: slotStart < bookingEnd AND slotEnd > bookingStart
 * Buffer time is added to bookingEnd for cleanup
 */
function slotOverlapsBooking(
  slotStart: MinutesSinceMidnight,
  slotEnd: MinutesSinceMidnight,
  bookingStart: MinutesSinceMidnight,
  bookingEnd: MinutesSinceMidnight,
  bufferMinutes: number = BUFFER_MINUTES
): boolean {
  // The booking effectively occupies [bookingStart, bookingEnd + buffer)
  const effectiveBookingEnd = bookingEnd + bufferMinutes;
  return slotStart < effectiveBookingEnd && slotEnd > bookingStart;
}

/**
 * Check if a specific staff member is available for a given slot
 * A staff is available if none of their non-cancelled bookings overlap with the slot
 */
function isStaffAvailableForSlot(
  staffId: string,
  slotStart: MinutesSinceMidnight,
  slotEnd: MinutesSinceMidnight,
  bookings: BookingOverlapInfo[]
): boolean {
  const staffBookings = bookings.filter(
    (b) => b.staffId === staffId && !NON_BLOCKING_STATUSES.has(b.status)
  );

  return !staffBookings.some((booking) =>
    slotOverlapsBooking(slotStart, slotEnd, booking.slotStart, booking.slotEnd)
  );
}

// ==================== MAIN: GET BRANCH SLOTS ====================

/**
 * Get available slots for a branch
 * Public endpoint — critical for booking flow
 *
 * @param branchId - Branch ID from URL
 * @param query - Query params: date, serviceId, variantId?, staffId?
 */
export async function getBranchSlots(
  branchId: string,
  query: { date: string; serviceId: string; variantId?: string; staffId?: string }
): Promise<SlotAvailabilityResponse> {
  const { date, serviceId, variantId, staffId } = query;

  // 1. Validate date
  validateDate(date);

  // 2. Check branch exists and get working hours
  const branch = await prisma.branch.findUnique({
    where: { id: branchId },
    select: {
      id: true,
      openTime: true,
      closeTime: true,
      isActive: true,
      holidays: {
        where: {
          date: parseDateString(date),
        },
        select: {
          reasonHi: true,
          reasonEn: true,
        },
      },
    },
  });

  if (!branch) {
    throw new BranchNotFoundError();
  }

  // 3. Check if branch is closed on this date (holiday)
  const holiday = branch.holidays[0];
  if (holiday) {
    return {
      date,
      branchId,
      serviceId,
      variantId: variantId || null,
      staffId: staffId || null,
      isHoliday: true,
      holidayReason: holiday.reasonHi,
      openTime: dateToTimeString(branch.openTime),
      closeTime: dateToTimeString(branch.closeTime),
      slotDuration: 0,
      slotStep: SLOT_STEP_MINUTES,
      bufferMinutes: BUFFER_MINUTES,
      slots: [],
    };
  }

  // 4. Get service duration
  const service = await prisma.service.findUnique({
    where: { id: serviceId },
    select: {
      id: true,
      durationMinutes: true,
      isActive: true,
      branchId: true,
    },
  });

  if (!service) {
    throw new ServiceNotFoundError();
  }

  // Determine effective duration (variant overrides service duration)
  let slotDuration = service.durationMinutes;

  if (variantId) {
    const variant = await prisma.serviceVariant.findUnique({
      where: { id: variantId },
      select: { durationMinutes: true, serviceId: true, isActive: true },
    });

    if (!variant) {
      throw new ServiceVariantNotFoundError();
    }

    if (variant.serviceId !== serviceId) {
      throw new ServiceVariantNotFoundError();
    }

    slotDuration = variant.durationMinutes;
  }

  // 5. Branch working hours
  const branchOpen = timeToMinutes(dateToTimeString(branch.openTime));
  const branchClose = timeToMinutes(dateToTimeString(branch.closeTime));

  // Is this date today? If so, we need current IST time for past-slot filtering
  const currentISTDate = getCurrentISTDate();
  const isToday = date === currentISTDate;
  const currentISTMinutes = isToday ? getCurrentISTMinutes() : undefined;

  // ==================== IF SPECIFIC STAFF PROVIDED ====================

  if (staffId) {
    return await getSlotsForSpecificStaff(
      branchId,
      staffId,
      date,
      serviceId,
      variantId || null,
      slotDuration,
      branchOpen,
      branchClose,
      isToday,
      currentISTMinutes
    );
  }

  // ==================== NO SPECIFIC STAFF — FIND ALL AVAILABLE ====================

  return await getSlotsForAnyAvailableStaff(
    branchId,
    date,
    serviceId,
    variantId || null,
    slotDuration,
    branchOpen,
    branchClose,
    isToday,
    currentISTMinutes
  );
}

// ==================== STAFF-SPECIFIC SLOTS ====================

/**
 * Get slots for a specific staff member within a branch
 * Checks: staff exists, isAvailable, workDays, leaves, existing bookings
 */
async function getSlotsForSpecificStaff(
  branchId: string,
  staffId: string,
  date: string,
  serviceId: string,
  variantId: string | null,
  slotDuration: number,
  branchOpen: MinutesSinceMidnight,
  branchClose: MinutesSinceMidnight,
  isToday: boolean,
  currentISTMinutes: MinutesSinceMidnight | undefined
): Promise<SlotAvailabilityResponse> {
  // Get staff profile
  const staff = await prisma.staff.findUnique({
    where: { id: staffId },
    select: {
      id: true,
      isAvailable: true,
      workDays: true,
      workStart: true,
      workEnd: true,
      user: {
        select: { name: true },
      },
    },
  });

  if (!staff) {
    throw new StaffNotFoundError();
  }

  // Check staff belongs to this branch
  const staffBranchCheck = await prisma.staff.findFirst({
    where: { id: staffId, branchId },
  });

  if (!staffBranchCheck) {
    throw new StaffNotFoundError();
  }

  const staffName = staff.user.name || "स्टाफ";
  const staffNameEn = staff.user.name || "Staff";

  // Check if staff works on this day of week
  const dayKey = getDayKey(date);
  const workDays = staff.workDays as unknown as WorkDays;

  if (!workDays[dayKey]) {
    // Staff doesn't work on this day — return empty slots
    return {
      date,
      branchId,
      serviceId,
      variantId,
      staffId,
      isHoliday: false,
      holidayReason: null,
      openTime: minutesToTime(branchOpen),
      closeTime: minutesToTime(branchClose),
      slotDuration,
      slotStep: SLOT_STEP_MINUTES,
      bufferMinutes: BUFFER_MINUTES,
      slots: [],
    };
  }

  // Check if staff is on leave
  const leave = await prisma.staffLeave.findFirst({
    where: {
      staffId,
      date: parseDateString(date),
    },
  });

  if (leave) {
    // Staff is on leave — return empty slots
    return {
      date,
      branchId,
      serviceId,
      variantId,
      staffId,
      isHoliday: false,
      holidayReason: null,
      openTime: minutesToTime(branchOpen),
      closeTime: minutesToTime(branchClose),
      slotDuration,
      slotStep: SLOT_STEP_MINUTES,
      bufferMinutes: BUFFER_MINUTES,
      slots: [],
    };
  }

  // Calculate effective working hours = intersection of branch and staff hours
  const staffWorkStart = timeToMinutes(dateToTimeString(staff.workStart));
  const staffWorkEnd = timeToMinutes(dateToTimeString(staff.workEnd));
  const effectiveOpen = Math.max(branchOpen, staffWorkStart);
  const effectiveClose = Math.min(branchClose, staffWorkEnd);

  if (effectiveOpen >= effectiveClose) {
    // No overlap between branch and staff hours
    return {
      date,
      branchId,
      serviceId,
      variantId,
      staffId,
      isHoliday: false,
      holidayReason: null,
      openTime: minutesToTime(effectiveOpen),
      closeTime: minutesToTime(effectiveClose),
      slotDuration,
      slotStep: SLOT_STEP_MINUTES,
      bufferMinutes: BUFFER_MINUTES,
      slots: [],
    };
  }

  // Get staff's existing bookings for this date
  const bookings = await getStaffBookings(staffId, date);

  // Generate time slots
  const rawSlots = generateTimeSlots(
    effectiveOpen,
    effectiveClose,
    slotDuration,
    SLOT_STEP_MINUTES,
    currentISTMinutes
  );

  // Build slot items with availability
  const slots: SlotItem[] = rawSlots.map((slot) => {
    const isAvailable = isStaffAvailableForSlot(
      staffId,
      slot.startTime,
      slot.endTime,
      bookings
    );

    return {
      startTime: minutesToTime(slot.startTime),
      endTime: minutesToTime(slot.endTime),
      isAvailable,
      availableStaff: isAvailable
        ? [{ staffId, name: staffName, nameEn: staffNameEn }]
        : [],
    };
  });

  return {
    date,
    branchId,
    serviceId,
    variantId,
    staffId,
    isHoliday: false,
    holidayReason: null,
    openTime: minutesToTime(effectiveOpen),
    closeTime: minutesToTime(effectiveClose),
    slotDuration,
    slotStep: SLOT_STEP_MINUTES,
    bufferMinutes: BUFFER_MINUTES,
    slots,
  };
}

// ==================== ANY AVAILABLE STAFF SLOTS ====================

/**
 * Get slots with availability across all staff who can perform the service
 * For each slot, checks which staff are free
 * A slot is "available" if at least 1 staff member is free
 */
async function getSlotsForAnyAvailableStaff(
  branchId: string,
  date: string,
  serviceId: string,
  variantId: string | null,
  slotDuration: number,
  branchOpen: MinutesSinceMidnight,
  branchClose: MinutesSinceMidnight,
  isToday: boolean,
  currentISTMinutes: MinutesSinceMidnight | undefined
): Promise<SlotAvailabilityResponse> {
  // Get all staff who can perform this service AND belong to this branch
  const staffServices = await prisma.staffService.findMany({
    where: {
      serviceId,
      staff: {
        branchId,
        isAvailable: true,
      },
    },
    include: {
      staff: {
        select: {
          id: true,
          isAvailable: true,
          workDays: true,
          workStart: true,
          workEnd: true,
          user: {
            select: { name: true },
          },
        },
      },
    },
  });

  if (staffServices.length === 0) {
    throw new SlotNoStaffAvailableError();
  }

  // Filter to staff who work on this day and are not on leave
  const dayKey = getDayKey(date);
  const dateObj = parseDateString(date);

  // Check leaves for all relevant staff in one query
  const staffIds = staffServices.map((ss) => ss.staff.id);
  const leaves = await prisma.staffLeave.findMany({
    where: {
      staffId: { in: staffIds },
      date: dateObj,
    },
    select: { staffId: true },
  });
  const staffOnLeave = new Set(leaves.map((l) => l.staffId));

  // Build eligible staff list
  const eligibleStaff: StaffScheduleInfo[] = [];

  for (const ss of staffServices) {
    const staff = ss.staff;
    const workDays = staff.workDays as unknown as WorkDays;

    // Must work on this day
    if (!workDays[dayKey]) continue;

    // Must not be on leave
    if (staffOnLeave.has(staff.id)) continue;

    const staffName = staff.user.name || "स्टाफ";
    const staffNameEn = staff.user.name || "Staff";

    eligibleStaff.push({
      staffId: staff.id,
      name: staffName,
      nameEn: staffNameEn,
      workStart: timeToMinutes(dateToTimeString(staff.workStart)),
      workEnd: timeToMinutes(dateToTimeString(staff.workEnd)),
      workDays,
      isAvailable: staff.isAvailable,
      hasLeave: false,
    });
  }

  if (eligibleStaff.length === 0) {
    throw new SlotNoStaffAvailableError();
  }

  // Get all bookings for eligible staff on this date
  const allBookings = await getMultipleStaffBookings(
    eligibleStaff.map((s) => s.staffId),
    date
  );

  // Generate slots using branch hours as the base
  const rawSlots = generateTimeSlots(
    branchOpen,
    branchClose,
    slotDuration,
    SLOT_STEP_MINUTES,
    currentISTMinutes
  );

  // Build slot items with availability
  const slots: SlotItem[] = rawSlots.map((slot) => {
    const availableStaff: AvailableStaffInfo[] = [];

    for (const staff of eligibleStaff) {
      // Check if staff's working hours cover this slot
      if (slot.startTime < staff.workStart || slot.endTime > staff.workEnd) {
        continue; // Slot is outside staff's working hours
      }

      // Check if slot is within branch hours (already ensured by generateTimeSlots)

      // Check if staff is free (no booking overlap)
      const isFree = isStaffAvailableForSlot(
        staff.staffId,
        slot.startTime,
        slot.endTime,
        allBookings
      );

      if (isFree) {
        availableStaff.push({
          staffId: staff.staffId,
          name: staff.name,
          nameEn: staff.nameEn,
        });
      }
    }

    return {
      startTime: minutesToTime(slot.startTime),
      endTime: minutesToTime(slot.endTime),
      isAvailable: availableStaff.length > 0,
      availableStaff,
    };
  });

  return {
    date,
    branchId,
    serviceId,
    variantId,
    staffId: null,
    isHoliday: false,
    holidayReason: null,
    openTime: minutesToTime(branchOpen),
    closeTime: minutesToTime(branchClose),
    slotDuration,
    slotStep: SLOT_STEP_MINUTES,
    bufferMinutes: BUFFER_MINUTES,
    slots,
  };
}

// ==================== MAIN: GET STAFF SLOTS ====================

/**
 * Get available slots for a specific staff member
 * Public endpoint — for viewing a staff member's availability
 *
 * @param staffId - Staff ID from URL
 * @param query - Query params: date, serviceId, variantId?
 */
export async function getStaffSlots(
  staffId: string,
  query: { date: string; serviceId: string; variantId?: string }
): Promise<SlotAvailabilityResponse> {
  const { date, serviceId, variantId } = query;

  // 1. Validate date
  validateDate(date);

  // 2. Get staff profile with branch info
  const staff = await prisma.staff.findUnique({
    where: { id: staffId },
    select: {
      id: true,
      branchId: true,
      isAvailable: true,
      workDays: true,
      workStart: true,
      workEnd: true,
      user: {
        select: { name: true },
      },
    },
  });

  if (!staff) {
    throw new StaffNotFoundError();
  }

  const branchId = staff.branchId;

  // 3. Get branch info (hours, holidays)
  const branch = await prisma.branch.findUnique({
    where: { id: branchId },
    select: {
      id: true,
      openTime: true,
      closeTime: true,
      holidays: {
        where: {
          date: parseDateString(date),
        },
        select: {
          reasonHi: true,
          reasonEn: true,
        },
      },
    },
  });

  if (!branch) {
    throw new BranchNotFoundError();
  }

  // 4. Check if branch is closed on this date (holiday)
  const holiday = branch.holidays[0];
  if (holiday) {
    return {
      date,
      branchId,
      serviceId,
      variantId: variantId || null,
      staffId,
      isHoliday: true,
      holidayReason: holiday.reasonHi,
      openTime: dateToTimeString(branch.openTime),
      closeTime: dateToTimeString(branch.closeTime),
      slotDuration: 0,
      slotStep: SLOT_STEP_MINUTES,
      bufferMinutes: BUFFER_MINUTES,
      slots: [],
    };
  }

  // 5. Get service duration
  const service = await prisma.service.findUnique({
    where: { id: serviceId },
    select: { durationMinutes: true, isActive: true },
  });

  if (!service) {
    throw new ServiceNotFoundError();
  }

  let slotDuration = service.durationMinutes;

  if (variantId) {
    const variant = await prisma.serviceVariant.findUnique({
      where: { id: variantId },
      select: { durationMinutes: true, serviceId: true, isActive: true },
    });

    if (!variant || variant.serviceId !== serviceId) {
      throw new ServiceVariantNotFoundError();
    }

    slotDuration = variant.durationMinutes;
  }

  // 6. Check if staff works on this day
  const dayKey = getDayKey(date);
  const workDays = staff.workDays as unknown as WorkDays;

  if (!workDays[dayKey]) {
    const branchOpen = timeToMinutes(dateToTimeString(branch.openTime));
    const branchClose = timeToMinutes(dateToTimeString(branch.closeTime));
    return {
      date,
      branchId,
      serviceId,
      variantId: variantId || null,
      staffId,
      isHoliday: false,
      holidayReason: null,
      openTime: minutesToTime(branchOpen),
      closeTime: minutesToTime(branchClose),
      slotDuration,
      slotStep: SLOT_STEP_MINUTES,
      bufferMinutes: BUFFER_MINUTES,
      slots: [],
    };
  }

  // 7. Check if staff is on leave
  const leave = await prisma.staffLeave.findFirst({
    where: {
      staffId,
      date: parseDateString(date),
    },
  });

  if (leave) {
    const branchOpen = timeToMinutes(dateToTimeString(branch.openTime));
    const branchClose = timeToMinutes(dateToTimeString(branch.closeTime));
    return {
      date,
      branchId,
      serviceId,
      variantId: variantId || null,
      staffId,
      isHoliday: false,
      holidayReason: null,
      openTime: minutesToTime(branchOpen),
      closeTime: minutesToTime(branchClose),
      slotDuration,
      slotStep: SLOT_STEP_MINUTES,
      bufferMinutes: BUFFER_MINUTES,
      slots: [],
    };
  }

  // 8. Calculate effective working hours
  const branchOpen = timeToMinutes(dateToTimeString(branch.openTime));
  const branchClose = timeToMinutes(dateToTimeString(branch.closeTime));
  const staffWorkStart = timeToMinutes(dateToTimeString(staff.workStart));
  const staffWorkEnd = timeToMinutes(dateToTimeString(staff.workEnd));
  const effectiveOpen = Math.max(branchOpen, staffWorkStart);
  const effectiveClose = Math.min(branchClose, staffWorkEnd);

  if (effectiveOpen >= effectiveClose) {
    return {
      date,
      branchId,
      serviceId,
      variantId: variantId || null,
      staffId,
      isHoliday: false,
      holidayReason: null,
      openTime: minutesToTime(effectiveOpen),
      closeTime: minutesToTime(effectiveClose),
      slotDuration,
      slotStep: SLOT_STEP_MINUTES,
      bufferMinutes: BUFFER_MINUTES,
      slots: [],
    };
  }

  // 9. Get staff's existing bookings
  const bookings = await getStaffBookings(staffId, date);

  const staffName = staff.user.name || "स्टाफ";
  const staffNameEn = staff.user.name || "Staff";

  // Is this date today?
  const currentISTDate = getCurrentISTDate();
  const isToday = date === currentISTDate;
  const currentISTMinutes = isToday ? getCurrentISTMinutes() : undefined;

  // 10. Generate slots
  const rawSlots = generateTimeSlots(
    effectiveOpen,
    effectiveClose,
    slotDuration,
    SLOT_STEP_MINUTES,
    currentISTMinutes
  );

  const slots: SlotItem[] = rawSlots.map((slot) => {
    const isAvailable = isStaffAvailableForSlot(
      staffId,
      slot.startTime,
      slot.endTime,
      bookings
    );

    return {
      startTime: minutesToTime(slot.startTime),
      endTime: minutesToTime(slot.endTime),
      isAvailable,
      availableStaff: isAvailable
        ? [{ staffId, name: staffName, nameEn: staffNameEn }]
        : [],
    };
  });

  return {
    date,
    branchId,
    serviceId,
    variantId: variantId || null,
    staffId,
    isHoliday: false,
    holidayReason: null,
    openTime: minutesToTime(effectiveOpen),
    closeTime: minutesToTime(effectiveClose),
    slotDuration,
    slotStep: SLOT_STEP_MINUTES,
    bufferMinutes: BUFFER_MINUTES,
    slots,
  };
}

// ==================== BOOKING QUERIES ====================

/**
 * Get a staff member's bookings for a specific date
 * Returns only the fields needed for overlap checking
 */
async function getStaffBookings(
  staffId: string,
  date: string
): Promise<BookingOverlapInfo[]> {
  const dateObj = parseDateString(date);

  const bookings = await prisma.booking.findMany({
    where: {
      staffId,
      bookingDate: dateObj,
      status: { notIn: ["CANCELLED", "NO_SHOW"] },
    },
    select: {
      staffId: true,
      slotStart: true,
      slotEnd: true,
      status: true,
    },
  });

  return bookings.map((b) => ({
    staffId: b.staffId!,
    slotStart: timeToMinutes(dateToTimeString(b.slotStart)),
    slotEnd: timeToMinutes(dateToTimeString(b.slotEnd)),
    status: b.status,
  }));
}

/**
 * Get bookings for multiple staff members on a specific date
 * Optimized for batch overlap checking
 */
async function getMultipleStaffBookings(
  staffIds: string[],
  date: string
): Promise<BookingOverlapInfo[]> {
  const dateObj = parseDateString(date);

  const bookings = await prisma.booking.findMany({
    where: {
      staffId: { in: staffIds },
      bookingDate: dateObj,
      status: { notIn: ["CANCELLED", "NO_SHOW"] },
    },
    select: {
      staffId: true,
      slotStart: true,
      slotEnd: true,
      status: true,
    },
  });

  return bookings.map((b) => ({
    staffId: b.staffId!,
    slotStart: timeToMinutes(dateToTimeString(b.slotStart)),
    slotEnd: timeToMinutes(dateToTimeString(b.slotEnd)),
    status: b.status,
  }));
}
