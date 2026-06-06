/**
 * Purpose: Slot availability API endpoint
 * Responsibility: Calculate available time slots for a given branch/service/date
 *
 * Endpoints:
 *   GET /api/slots/available   — Calculate available slots (public)
 *
 * GET Query Params:
 *   branchId  (required) — Branch to check
 *   serviceId (required) — Service to book
 *   date      (required) — Date in YYYY-MM-DD format
 *   staffId   (optional) — Specific staff member
 *   variantId (optional) — Service variant (affects duration)
 *
 * GET Response:
 *   200: { success: true, data: { date, slots: [{ time, available, staffId? }] } }
 *
 * Logic:
 *   1. Get branch open/close time
 *   2. Get service duration (or variant duration if variantId provided)
 *   3. Get staff work hours if staffId provided
 *   4. Get existing bookings for that date/staff/branch
 *   5. Get staff leaves to check if staff is on leave
 *   6. Generate 30-min interval slots between open-close time
 *   7. Mark slots as available/unavailable based on existing bookings
 *
 * Error Responses:
 *   400: { success: false, error, message }
 *   404: { success: false, error: "RES_NOT_FOUND" }
 */

import { createApiHandler } from "@/lib/api-handler";
import { prisma } from "@/lib/prisma";
import { NotFoundError } from "@/lib/errors";
import { HTTP_STATUS } from "@/lib/http";
import { availableSlotsQuerySchema } from "@/lib/validations/slots";

// ==================== Helper — generate time slots ====================

/**
 * Generate 30-minute interval time slots between start and end times
 * Returns times in HH:MM format
 */
function generateTimeSlots(startHour: number, startMin: number, endHour: number, endMin: number): string[] {
  const slots: string[] = [];
  let currentMinutes = startHour * 60 + startMin;
  const endMinutes = endHour * 60 + endMin;

  while (currentMinutes < endMinutes) {
    const hours = Math.floor(currentMinutes / 60);
    const minutes = currentMinutes % 60;
    const timeStr = `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
    slots.push(timeStr);
    currentMinutes += 30; // 30-minute intervals
  }

  return slots;
}

/**
 * Parse a Time field (stored as DateTime in Prisma with @db.Time(0)) to hours and minutes
 */
function parseTimeToDateParts(timeValue: Date | string): { hours: number; minutes: number } {
  const d = new Date(timeValue);
  return {
    hours: d.getUTCHours(),
    minutes: d.getUTCMinutes(),
  };
}

// ==================== GET — Available Slots (Public) ====================

export const GET = createApiHandler({
  schema: null,
  handler: async ({ request }) => {
    // 1. Parse and validate query params
    const url = new URL(request.url);
    const queryResult = availableSlotsQuerySchema.safeParse({
      branchId: url.searchParams.get("branchId") || undefined,
      serviceId: url.searchParams.get("serviceId") || undefined,
      date: url.searchParams.get("date") || undefined,
      staffId: url.searchParams.get("staffId") || undefined,
      variantId: url.searchParams.get("variantId") || undefined,
    });

    if (!queryResult.success) {
      const firstIssue = queryResult.error.issues[0];
      const fieldPath = firstIssue.path.join(".");
      const message = fieldPath
        ? `${fieldPath}: ${firstIssue.message}`
        : firstIssue.message;

      return Response.json(
        {
          success: false,
          error: "VAL_INVALID_INPUT",
          message,
          statusCode: HTTP_STATUS.BAD_REQUEST,
        },
        { status: HTTP_STATUS.BAD_REQUEST }
      );
    }

    const { branchId, serviceId, date, staffId, variantId } = queryResult.data;

    // 2. Get branch open/close time
    const branch = await prisma.branch.findUnique({
      where: { id: branchId },
    });
    if (!branch) {
      throw new NotFoundError("Branch not found");
    }
    if (!branch.isActive) {
      throw new NotFoundError("Branch is not active");
    }

    const openTime = parseTimeToDateParts(branch.openTime);
    const closeTime = parseTimeToDateParts(branch.closeTime);

    // 3. Get service duration (or variant duration if variantId provided)
    const service = await prisma.service.findUnique({
      where: { id: serviceId },
    });
    if (!service) {
      throw new NotFoundError("Service not found");
    }

    let durationMinutes = service.durationMinutes;

    if (variantId) {
      const variant = await prisma.serviceVariant.findFirst({
        where: { id: variantId, serviceId, isActive: true },
      });
      if (!variant) {
        throw new NotFoundError("Service variant not found");
      }
      durationMinutes = variant.durationMinutes;
    }

    // 4. Determine effective working hours
    let effectiveStart = openTime;
    let effectiveEnd = closeTime;

    if (staffId) {
      // Get staff work hours
      const staff = await prisma.staff.findUnique({
        where: { id: staffId },
      });
      if (!staff) {
        throw new NotFoundError("Staff not found");
      }
      if (!staff.isAvailable) {
        // Staff is unavailable, return empty slots
        return {
          date,
          slots: [],
        };
      }

      // Check staff leave for this date
      const leave = await prisma.staffLeave.findUnique({
        where: {
          staffId_date: {
            staffId,
            date: new Date(date),
          },
        },
      });
      if (leave) {
        // Staff is on leave, return empty slots
        return {
          date,
          slots: [],
        };
      }

      // Check if staff works on this day
      const dateObj = new Date(date);
      const dayOfWeek = dateObj.getUTCDay(); // 0=Sun, 1=Mon, ...
      const dayKeys = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const;
      const dayKey = dayKeys[dayOfWeek];
      const workDays = JSON.parse(staff.workDays) as Record<string, boolean>;
      if (!workDays[dayKey]) {
        // Staff doesn't work on this day
        return {
          date,
          slots: [],
        };
      }

      // Use staff work hours as effective hours (may be narrower than branch hours)
      const staffStart = parseTimeToDateParts(staff.workStart);
      const staffEnd = parseTimeToDateParts(staff.workEnd);

      effectiveStart = {
        hours: Math.max(openTime.hours, staffStart.hours),
        minutes: openTime.hours > staffStart.hours ? openTime.minutes :
                 staffStart.hours > openTime.hours ? staffStart.minutes :
                 Math.max(openTime.minutes, staffStart.minutes),
      };

      // Simplified: use the later start time
      const startMinutesBranch = openTime.hours * 60 + openTime.minutes;
      const startMinutesStaff = staffStart.hours * 60 + staffStart.minutes;
      const effectiveStartMinutes = Math.max(startMinutesBranch, startMinutesStaff);
      effectiveStart = {
        hours: Math.floor(effectiveStartMinutes / 60),
        minutes: effectiveStartMinutes % 60,
      };

      // Use the earlier end time
      const endMinutesBranch = closeTime.hours * 60 + closeTime.minutes;
      const endMinutesStaff = staffEnd.hours * 60 + staffEnd.minutes;
      const effectiveEndMinutes = Math.min(endMinutesBranch, endMinutesStaff);
      effectiveEnd = {
        hours: Math.floor(effectiveEndMinutes / 60),
        minutes: effectiveEndMinutes % 60,
      };
    }

    // 5. Generate time slots (30-min intervals)
    const allSlots = generateTimeSlots(
      effectiveStart.hours,
      effectiveStart.minutes,
      effectiveEnd.hours,
      effectiveEnd.minutes
    );

    // 6. Get existing bookings for that date
    const bookingWhere: Record<string, unknown> = {
      branchId,
      bookingDate: new Date(date),
      status: { in: ["PENDING", "CONFIRMED", "IN_PROGRESS"] },
    };

    if (staffId) {
      bookingWhere.staffId = staffId;
    }

    const existingBookings = await prisma.booking.findMany({
      where: bookingWhere,
      select: {
        slotStart: true,
        slotEnd: true,
        staffId: true,
      },
    });

    // 7. Build booked slot ranges (in minutes from midnight)
    const bookedRanges = existingBookings.map((b) => {
      const start = parseTimeToDateParts(b.slotStart);
      const end = parseTimeToDateParts(b.slotEnd);
      return {
        startMinutes: start.hours * 60 + start.minutes,
        endMinutes: end.hours * 60 + end.minutes,
        staffId: b.staffId,
      };
    });

    // 8. Mark each slot as available/unavailable
    // A slot is unavailable if it overlaps with any existing booking
    // Slot at time T occupies: T to T + durationMinutes
    const slotDurationMinutes = durationMinutes;

    const slots = allSlots.map((time) => {
      const [hours, minutes] = time.split(":").map(Number);
      const slotStartMinutes = hours * 60 + minutes;
      const slotEndMinutes = slotStartMinutes + slotDurationMinutes;

      // Check if this slot overlaps with any booking
      const isBooked = bookedRanges.some((range) => {
        // Overlap: slotStart < rangeEnd && slotEnd > rangeStart
        return slotStartMinutes < range.endMinutes && slotEndMinutes > range.startMinutes;
      });

      // Also check if slot extends beyond effective close time
      const effectiveEndTotalMinutes = effectiveEnd.hours * 60 + effectiveEnd.minutes;
      const exceedsHours = slotEndMinutes > effectiveEndTotalMinutes;

      return {
        time,
        available: !isBooked && !exceedsHours,
        ...(staffId && { staffId }),
      };
    });

    // 9. Return result
    return {
      date,
      slots,
    };
  },
});
