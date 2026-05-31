/**
 * Purpose: Branch holidays management API endpoints
 * Responsibility: List holidays (public), add holiday (admin), remove holiday (admin)
 *
 * Endpoints:
 *   GET    /api/branches/[id]/holidays              — List holidays for branch (public)
 *   POST   /api/branches/[id]/holidays              — Add a holiday (admin only)
 *   DELETE /api/branches/[id]/holidays?holidayId=   — Remove a holiday (admin only)
 *
 * GET Response:
 *   200: { success: true, data: { holidays } }
 *
 * POST Request Body:
 *   { date (YYYY-MM-DD), reasonHi, reasonEn? (optional) }
 *   — Duplicate date for same branch returns 409 Conflict
 *
 * DELETE Query Params:
 *   holidayId (required) — The holiday ID to remove
 */

import { createApiHandler } from "@/lib/api-handler";
import { prisma } from "@/lib/prisma";
import { requireActiveUser } from "@/lib/auth-helpers";
import { NotFoundError, ConflictError, AdminRequiredError, ValidationError } from "@/lib/errors";
import { HTTP_STATUS } from "@/lib/http";
import { createHolidaySchema } from "@/lib/validations/branches";
import { cuid } from "@/lib/validations/common";

// ==================== Helper — extract branch [id] from URL ====================

function extractBranchIdFromUrl(request: Request): string | null {
  const url = new URL(request.url);
  const segments = url.pathname.split("/");
  const branchesIndex = segments.indexOf("branches");
  if (branchesIndex === -1) return null;
  return segments[branchesIndex + 1] || null;
}

// ==================== GET — List Holidays (Public) ====================

export const GET = createApiHandler({
  schema: null,
  handler: async ({ request }) => {
    const branchId = extractBranchIdFromUrl(request);
    if (!branchId) {
      throw new NotFoundError("Branch not found");
    }

    // 1. Check branch exists
    const branch = await prisma.branch.findUnique({
      where: { id: branchId },
    });
    if (!branch) {
      throw new NotFoundError("Branch not found");
    }

    // 2. Fetch holidays
    const holidays = await prisma.branchHoliday.findMany({
      where: { branchId },
      orderBy: { date: "asc" },
    });

    // 3. Return with serialized date fields
    return {
      holidays: holidays.map((h) => ({
        ...h,
        date: h.date.toISOString().slice(0, 10),
      })),
    };
  },
});

// ==================== POST — Add Holiday (Admin) ====================

export const POST = createApiHandler({
  schema: createHolidaySchema,
  successMessage: "Holiday added successfully",
  successStatus: HTTP_STATUS.CREATED,
  handler: async ({ parsedBody, request }) => {
    const branchId = extractBranchIdFromUrl(request);
    if (!branchId) {
      throw new NotFoundError("Branch not found");
    }

    // 1. Verify admin access
    const { user } = await requireActiveUser(request);
    if (user.role !== "ADMIN") {
      throw new AdminRequiredError();
    }

    // 2. Check branch exists
    const branch = await prisma.branch.findUnique({
      where: { id: branchId },
    });
    if (!branch) {
      throw new NotFoundError("Branch not found");
    }

    const { date, reasonHi, reasonEn } = parsedBody;

    // 3. Check for duplicate date
    const existingHoliday = await prisma.branchHoliday.findFirst({
      where: { branchId, date: new Date(date) },
    });
    if (existingHoliday) {
      throw new ConflictError("A holiday already exists for this date on this branch");
    }

    // 4. Create holiday
    const holiday = await prisma.branchHoliday.create({
      data: {
        branchId,
        date: new Date(date),
        reasonHi,
        reasonEn: reasonEn || null,
      },
    });

    // 5. Return with serialized date
    return {
      ...holiday,
      date: holiday.date.toISOString().slice(0, 10),
    };
  },
});

// ==================== DELETE — Remove Holiday (Admin) ====================

export const DELETE = createApiHandler({
  schema: null,
  successMessage: "Holiday removed successfully",
  handler: async ({ request }) => {
    const branchId = extractBranchIdFromUrl(request);
    if (!branchId) {
      throw new NotFoundError("Branch not found");
    }

    // 1. Verify admin access
    const { user } = await requireActiveUser(request);
    if (user.role !== "ADMIN") {
      throw new AdminRequiredError();
    }

    // 2. Extract holidayId from query params
    const url = new URL(request.url);
    const holidayId = url.searchParams.get("holidayId");

    if (!holidayId) {
      return Response.json(
        {
          success: false,
          error: "VAL_INVALID_INPUT",
          message: "holidayId query parameter is required",
          statusCode: HTTP_STATUS.BAD_REQUEST,
        },
        { status: HTTP_STATUS.BAD_REQUEST }
      );
    }

    // Validate holidayId format
    const holidayIdValidation = cuid.safeParse(holidayId);
    if (!holidayIdValidation.success) {
      throw new ValidationError("holidayId must be a valid ID");
    }

    // 3. Check branch exists
    const branch = await prisma.branch.findUnique({
      where: { id: branchId },
    });
    if (!branch) {
      throw new NotFoundError("Branch not found");
    }

    // 4. Find and delete the holiday
    const holiday = await prisma.branchHoliday.findFirst({
      where: {
        id: holidayId,
        branchId,
      },
    });

    if (!holiday) {
      throw new NotFoundError("Holiday not found for this branch");
    }

    await prisma.branchHoliday.delete({
      where: { id: holiday.id },
    });

    return null;
  },
});
