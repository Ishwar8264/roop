/**
 * Purpose: Staff list and create API endpoints
 * Responsibility: List staff profiles (public, paginated) and create staff profile (admin)
 *
 * Endpoints:
 *   GET  /api/staff        — List staff with pagination (public)
 *   POST /api/staff        — Create a staff profile (admin only)
 *
 * GET Query Params:
 *   branchId    (optional) — Filter by branch
 *   isAvailable (optional) — Filter by availability ("true"/"false")
 *   page        (default 1) — Page number
 *   pageSize    (default 20, max 100) — Items per page
 *
 * POST Request Body:
 *   userId, branchId, specialization (string[]), experienceYears (opt),
 *   bioHi (opt), bioEn (opt), workStart (HH:MM), workEnd (HH:MM),
 *   commissionRate (opt decimalString)
 *
 * Responses:
 *   200: { success: true, data: { items, pagination } }
 *   201: { success: true, data: staff, message }
 *   400: { success: false, error, message }
 *   403: { success: false, error: "PERM_ADMIN_REQUIRED", message }
 *   409: { success: false, error: "RES_CONFLICT", message }
 */

import { createApiHandler } from "@/lib/api-handler";
import { prisma } from "@/lib/prisma";
import { requireActiveUser } from "@/lib/auth-helpers";
import { NotFoundError, ConflictError, AdminRequiredError } from "@/lib/errors";
import { HTTP_STATUS } from "@/lib/http";
import {
  createStaffSchema,
  listStaffQuerySchema,
} from "@/lib/validations/staff";

// ==================== GET — List Staff (Public) ====================

export const GET = createApiHandler({
  schema: null,
  handler: async ({ request }) => {
    // 1. Parse and validate query params
    const url = new URL(request.url);
    const queryResult = listStaffQuerySchema.safeParse({
      branchId: url.searchParams.get("branchId") || undefined,
      isAvailable: url.searchParams.get("isAvailable") || undefined,
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

    const { branchId, isAvailable, page, pageSize } = queryResult.data;

    // 2. Build where clause
    const where: Record<string, unknown> = {};

    if (branchId) {
      where.branchId = branchId;
    }

    if (isAvailable !== undefined) {
      where.isAvailable = isAvailable;
    }

    // 3. Count total matching staff
    const total = await prisma.staff.count({ where });

    // 4. Fetch paginated staff profiles
    const staff = await prisma.staff.findMany({
      where,
      select: {
        id: true,
        userId: true,
        branchId: true,
        specialization: true,
        experienceYears: true,
        bioHi: true,
        bioEn: true,
        photoUrl: true,
        rating: true,
        isAvailable: true,
        workDays: true,
        workStart: true,
        workEnd: true,
        commissionRate: true,
        createdAt: true,
        updatedAt: true,
        user: {
          select: {
            id: true,
            name: true,
            mobile: true,
            avatarUrl: true,
          },
        },
        branch: {
          select: {
            id: true,
            nameHi: true,
            nameEn: true,
          },
        },
        _count: {
          select: { staffServices: true, bookings: true },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    // 5. Return with serialized decimals and pagination
    return {
      items: staff.map((s) => ({
        ...s,
        rating: s.rating.toString(),
        commissionRate: s.commissionRate ? s.commissionRate.toString() : null,
        servicesCount: s._count.staffServices,
        bookingsCount: s._count.bookings,
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

// ==================== POST — Create Staff (Admin) ====================

export const POST = createApiHandler({
  schema: createStaffSchema,
  successMessage: "Staff profile created successfully",
  successStatus: HTTP_STATUS.CREATED,
  handler: async ({ parsedBody, request }) => {
    const {
      userId,
      branchId,
      specialization,
      experienceYears,
      bioHi,
      bioEn,
      workStart,
      workEnd,
      commissionRate,
    } = parsedBody;

    // 1. Verify admin access
    const { user } = await requireActiveUser(request);
    if (user.role !== "ADMIN") {
      throw new AdminRequiredError();
    }

    // 2. Check user exists
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
    });
    if (!targetUser) {
      throw new NotFoundError("User not found");
    }

    // 3. Check branch exists
    const branch = await prisma.branch.findUnique({
      where: { id: branchId },
    });
    if (!branch) {
      throw new NotFoundError("Branch not found");
    }

    // 4. Check user doesn't already have a staff profile
    const existingStaff = await prisma.staff.findUnique({
      where: { userId },
    });
    if (existingStaff) {
      throw new ConflictError("This user already has a staff profile");
    }

    // 5. Create staff profile
    const newStaff = await prisma.staff.create({
      data: {
        userId,
        branchId,
        specialization: Array.isArray(specialization) ? specialization.join(",") : specialization,
        experienceYears: experienceYears ?? null,
        bioHi: bioHi ?? null,
        bioEn: bioEn ?? null,
        workStart: new Date(`1970-01-01T${workStart}:00`),
        workEnd: new Date(`1970-01-01T${workEnd}:00`),
        commissionRate: commissionRate ? parseFloat(commissionRate) : null,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            mobile: true,
            avatarUrl: true,
          },
        },
        branch: {
          select: {
            id: true,
            nameHi: true,
            nameEn: true,
          },
        },
      },
    });

    // 6. Return created staff with serialized decimals
    return {
      ...newStaff,
      rating: newStaff.rating.toString(),
      commissionRate: newStaff.commissionRate
        ? newStaff.commissionRate.toString()
        : null,
    };
  },
});
