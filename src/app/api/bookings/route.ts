/**
 * Purpose: Bookings list and create API endpoints
 * Responsibility: List bookings (auth required, role-based) and create booking (auth required)
 *
 * Endpoints:
 *   GET  /api/bookings        — List bookings with pagination (auth required)
 *   POST /api/bookings        — Create a new booking (auth required)
 *
 * GET Query Params:
 *   branchId  (optional) — Filter by branch
 *   staffId   (optional) — Filter by staff
 *   status    (optional) — Filter by booking status
 *   date      (optional) — Filter by date
 *   page      (default 1) — Page number
 *   pageSize  (default 20, max 100) — Items per page
 *
 * POST Request Body:
 *   serviceId, variantId (opt), staffId (opt), branchId,
 *   bookingDate (YYYY-MM-DD), slotStart (HH:MM), addOnIds (opt), notes (opt)
 *
 * Responses:
 *   200: { success: true, data: { items, pagination } }
 *   201: { success: true, data: booking, message }
 *   400: { success: false, error, message }
 *   401: { success: false, error: "AUTH_MISSING_TOKEN" }
 *   403: { success: false, error: "PERM_DENIED" }
 *   409: { success: false, error: "RES_CONFLICT" }
 */

import { createApiHandler } from "@/lib/api-handler";
import { prisma } from "@/lib/prisma";
import { requireActiveUser } from "@/lib/auth-helpers";
import { NotFoundError, ConflictError, ForbiddenError, ValidationError } from "@/lib/errors";
import { HTTP_STATUS } from "@/lib/http";
import {
  createBookingSchema,
  listBookingsQuerySchema,
} from "@/lib/validations/bookings";

// ==================== Helper — generate bookingDisplayId ====================

async function generateBookingDisplayId(): Promise<string> {
  const year = new Date().getFullYear();
  // Find the last booking display ID for this year
  const lastBooking = await prisma.booking.findFirst({
    where: {
      bookingDisplayId: {
        startsWith: `BK-${year}-`,
      },
    },
    orderBy: { bookingDisplayId: "desc" },
    select: { bookingDisplayId: true },
  });

  let nextSeq = 1;
  if (lastBooking) {
    const parts = lastBooking.bookingDisplayId.split("-");
    const lastSeq = parseInt(parts[parts.length - 1], 10);
    if (!isNaN(lastSeq)) {
      nextSeq = lastSeq + 1;
    }
  }

  return `BK-${year}-${nextSeq.toString().padStart(5, "0")}`;
}

// ==================== Helper — parse Time field ====================

function parseTimeToDateParts(timeValue: Date | string): { hours: number; minutes: number } {
  const d = new Date(timeValue);
  return {
    hours: d.getUTCHours(),
    minutes: d.getUTCMinutes(),
  };
}

// ==================== GET — List Bookings (Auth Required) ====================

export const GET = createApiHandler({
  schema: null,
  handler: async ({ request }) => {
    // 1. Require authentication
    const { user } = await requireActiveUser(request);

    // 2. Parse and validate query params
    const url = new URL(request.url);
    const queryResult = listBookingsQuerySchema.safeParse({
      branchId: url.searchParams.get("branchId") || undefined,
      staffId: url.searchParams.get("staffId") || undefined,
      status: url.searchParams.get("status") || undefined,
      date: url.searchParams.get("date") || undefined,
      page: url.searchParams.get("page") || undefined,
      pageSize: url.searchParams.get("pageSize") || undefined,
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

    const { branchId, staffId, status, date, page, pageSize } = queryResult.data;

    // 3. Build where clause — role-based filtering
    const where: Record<string, unknown> = {};

    // USER role can only see their own bookings
    if (user.role === "USER") {
      where.userId = user.id;
    } else if (user.role === "STAFF") {
      // STAFF can see bookings assigned to them OR their own
      where.OR = [
        { staffId: user.id },
        { userId: user.id },
      ];
    }
    // ADMIN can see all bookings — no user filter

    if (branchId) where.branchId = branchId;
    if (staffId && user.role !== "USER") where.staffId = staffId;
    if (status) where.status = status;
    if (date) where.bookingDate = new Date(date);

    // 4. Count total matching bookings
    const total = await prisma.booking.count({ where });

    // 5. Fetch paginated bookings
    const bookings = await prisma.booking.findMany({
      where,
      select: {
        id: true,
        bookingDisplayId: true,
        userId: true,
        serviceId: true,
        variantId: true,
        staffId: true,
        branchId: true,
        bookingDate: true,
        slotStart: true,
        slotEnd: true,
        status: true,
        advanceAmount: true,
        totalAmount: true,
        cancellationReason: true,
        notes: true,
        createdAt: true,
        updatedAt: true,
        user: {
          select: { id: true, name: true, mobile: true },
        },
        service: {
          select: { id: true, nameHi: true, nameEn: true, price: true, durationMinutes: true },
        },
        variant: {
          select: { id: true, nameHi: true, nameEn: true, price: true, durationMinutes: true },
        },
        staff: {
          select: {
            id: true,
            user: { select: { id: true, name: true } },
          },
        },
        branch: {
          select: { id: true, nameHi: true, nameEn: true },
        },
        _count: {
          select: { addOns: true },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    // 6. Return with serialized decimals
    return {
      items: bookings.map((b) => ({
        ...b,
        bookingDate: b.bookingDate.toISOString().split("T")[0],
        advanceAmount: b.advanceAmount ? b.advanceAmount.toString() : null,
        totalAmount: b.totalAmount.toString(),
        service: {
          ...b.service,
          price: b.service.price.toString(),
        },
        variant: b.variant
          ? { ...b.variant, price: b.variant.price.toString() }
          : null,
        addOnsCount: b._count.addOns,
        _count: undefined,
      })),
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  },
});

// ==================== POST — Create Booking (Auth Required) ====================

export const POST = createApiHandler({
  schema: createBookingSchema,
  successMessage: "Booking created successfully",
  successStatus: HTTP_STATUS.CREATED,
  handler: async ({ parsedBody, request }) => {
    const {
      serviceId,
      variantId,
      staffId,
      branchId,
      bookingDate,
      slotStart,
      addOnIds,
      notes,
    } = parsedBody;

    // 1. Require authentication
    const { user } = await requireActiveUser(request);

    // 2. Verify service exists
    const service = await prisma.service.findUnique({
      where: { id: serviceId },
    });
    if (!service) {
      throw new NotFoundError("Service not found");
    }
    if (!service.isActive) {
      throw new NotFoundError("Service is not available");
    }

    // 3. Verify variant if provided
    let variant: Awaited<ReturnType<typeof prisma.serviceVariant.findFirst>> = null;
    if (variantId) {
      variant = await prisma.serviceVariant.findFirst({
        where: { id: variantId, serviceId, isActive: true },
      });
      if (!variant) {
        throw new NotFoundError("Service variant not found");
      }
    }

    // 4. Verify branch exists
    const branch = await prisma.branch.findUnique({
      where: { id: branchId },
    });
    if (!branch) {
      throw new NotFoundError("Branch not found");
    }

    // 5. Verify staff if provided
    if (staffId) {
      const staff = await prisma.staff.findUnique({
        where: { id: staffId },
      });
      if (!staff) {
        throw new NotFoundError("Staff not found");
      }
      if (!staff.isAvailable) {
        throw new ValidationError("Staff member is not available");
      }

      // Check if staff is on leave
      const leave = await prisma.staffLeave.findUnique({
        where: {
          staffId_date: {
            staffId,
            date: new Date(bookingDate),
          },
        },
      });
      if (leave) {
        throw new ConflictError("Staff member is on leave on this date");
      }

      // Check if staff can perform this service
      const staffService = await prisma.staffService.findUnique({
        where: {
          staffId_serviceId: {
            staffId,
            serviceId,
          },
        },
      });
      if (!staffService) {
        throw new ValidationError("Staff member cannot perform this service");
      }
    }

    // 6. Check slot availability — no double-booking for same staff+date+time
    const slotStartDate = new Date(`1970-01-01T${slotStart}:00`);
    const durationMinutes = variant ? variant.durationMinutes : service.durationMinutes;

    // Calculate slotEnd = slotStart + durationMinutes
    const slotEndMinutes = slotStartDate.getUTCMinutes() + durationMinutes;
    const slotEndHours = slotStartDate.getUTCHours() + Math.floor(slotEndMinutes / 60);
    const slotEndDate = new Date(`1970-01-01T${slotEndHours.toString().padStart(2, "0")}:${(slotEndMinutes % 60).toString().padStart(2, "0")}:00`);

    // Check for overlapping bookings
    const overlappingWhere: Record<string, unknown> = {
      branchId,
      bookingDate: new Date(bookingDate),
      status: { in: ["PENDING", "CONFIRMED", "IN_PROGRESS"] },
    };

    if (staffId) {
      overlappingWhere.staffId = staffId;
    }

    const existingBookings = await prisma.booking.findMany({
      where: overlappingWhere,
      select: { slotStart: true, slotEnd: true },
    });

    const newSlotStartMin = slotStartDate.getUTCHours() * 60 + slotStartDate.getUTCMinutes();
    const newSlotEndMin = slotEndHours * 60 + (slotEndMinutes % 60);

    const hasOverlap = existingBookings.some((b) => {
      const existStart = parseTimeToDateParts(b.slotStart);
      const existEnd = parseTimeToDateParts(b.slotEnd);
      const existStartMin = existStart.hours * 60 + existStart.minutes;
      const existEndMin = existEnd.hours * 60 + existEnd.minutes;
      // Overlap: newStart < existEnd && newEnd > existStart
      return newSlotStartMin < existEndMin && newSlotEndMin > existStartMin;
    });

    if (hasOverlap) {
      throw new ConflictError("This time slot is already booked");
    }

    // 7. Calculate totalAmount = service price + variant price difference + addon prices
    let servicePrice = parseFloat(service.price.toString());
    let variantPriceDiff = 0;

    if (variant) {
      variantPriceDiff = parseFloat(variant.price.toString()) - servicePrice;
      // Use variant price as the base for total calculation
      servicePrice = parseFloat(variant.price.toString());
      variantPriceDiff = 0;
    }

    let addOnsTotal = 0;
    let addOnRecords: { addOnId: string; name: string; price: number }[] = [];

    if (addOnIds && addOnIds.length > 0) {
      const addOns = await prisma.serviceAddOn.findMany({
        where: {
          id: { in: addOnIds },
          serviceId,
          isActive: true,
        },
      });

      for (const addOn of addOns) {
        const addOnPrice = parseFloat(addOn.price.toString());
        addOnsTotal += addOnPrice;
        addOnRecords.push({
          addOnId: addOn.id,
          name: addOn.nameEn, // Snapshot English name
          price: addOnPrice,
        });
      }
    }

    const totalAmount = servicePrice + variantPriceDiff + addOnsTotal;

    // 8. Generate bookingDisplayId
    const bookingDisplayId = await generateBookingDisplayId();

    // 9. Create booking with status history and add-ons
    const booking = await prisma.booking.create({
      data: {
        bookingDisplayId,
        userId: user.id,
        serviceId,
        variantId: variantId || null,
        staffId: staffId || null,
        branchId,
        bookingDate: new Date(bookingDate),
        slotStart: slotStartDate,
        slotEnd: slotEndDate,
        status: "PENDING",
        totalAmount,
        notes: notes || null,
        // Create initial status history entry
        statusHistory: {
          create: {
            status: "PENDING",
            changedBy: user.id,
            reason: "Booking created",
          },
        },
        // Create add-on records if any
        addOns: addOnRecords.length > 0
          ? {
              createMany: {
                data: addOnRecords.map((ao) => ({
                  addOnId: ao.addOnId,
                  name: ao.name,
                  price: ao.price,
                })),
              },
            }
          : undefined,
      },
      include: {
        user: {
          select: { id: true, name: true, mobile: true },
        },
        service: {
          select: { id: true, nameHi: true, nameEn: true, price: true, durationMinutes: true },
        },
        variant: {
          select: { id: true, nameHi: true, nameEn: true, price: true, durationMinutes: true },
        },
        staff: {
          select: {
            id: true,
            user: { select: { id: true, name: true } },
          },
        },
        branch: {
          select: { id: true, nameHi: true, nameEn: true },
        },
        addOns: true,
      },
    });

    // 10. Return with serialized decimals
    return {
      ...booking,
      bookingDate: booking.bookingDate.toISOString().split("T")[0],
      advanceAmount: booking.advanceAmount ? booking.advanceAmount.toString() : null,
      totalAmount: booking.totalAmount.toString(),
      service: {
        ...booking.service,
        price: booking.service.price.toString(),
      },
      variant: booking.variant
        ? { ...booking.variant, price: booking.variant.price.toString() }
        : null,
      addOns: booking.addOns.map((ao) => ({
        ...ao,
        price: ao.price.toString(),
      })),
    };
  },
});
