/**
 * Purpose: Branch list and create API endpoints
 * Responsibility: List branches (public, paginated) and create new branches (admin only)
 *
 * Endpoints:
 *   GET  /api/branches  — List branches with pagination (public)
 *   POST /api/branches  — Create a new branch (admin only)
 *
 * GET Query Params:
 *   city     (optional) — Filter by city
 *   isActive (optional) — Filter by active status ("true"/"false")
 *   page     (default 1) — Page number
 *   pageSize (default 20, max 100) — Items per page
 *
 * POST Request Body:
 *   nameHi, nameEn, city, address, googleMapsUrl (optional),
 *   phone, openTime (HH:MM), closeTime (HH:MM)
 */

import { createApiHandler } from "@/lib/api-handler";
import { prisma } from "@/lib/prisma";
import { requireActiveUser } from "@/lib/auth-helpers";
import { AdminRequiredError } from "@/lib/errors";
import { HTTP_STATUS } from "@/lib/http";
import {
  createBranchSchema,
  listBranchesQuerySchema,
} from "@/lib/validations/branches";

// ==================== GET — List Branches (Public) ====================

export const GET = createApiHandler({
  schema: null,
  handler: async ({ request }) => {
    // 1. Parse and validate query params
    const url = new URL(request.url);
    const queryResult = listBranchesQuerySchema.safeParse({
      city: url.searchParams.get("city") || undefined,
      isActive: url.searchParams.get("isActive") || undefined,
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

    const { city, isActive, page, pageSize } = queryResult.data;

    // 2. Build where clause
    const where: Record<string, unknown> = {};

    if (city) where.city = city;
    if (isActive !== undefined) where.isActive = isActive;

    // 3. Count total matching branches
    const total = await prisma.branch.count({ where });

    // 4. Fetch paginated branches
    const branches = await prisma.branch.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    // 5. Return with pagination
    return {
      branches,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  },
});

// ==================== POST — Create Branch (Admin) ====================

export const POST = createApiHandler({
  schema: createBranchSchema,
  successMessage: "Branch created successfully",
  successStatus: HTTP_STATUS.CREATED,
  handler: async ({ parsedBody, request }) => {
    const {
      nameHi,
      nameEn,
      city,
      address,
      googleMapsUrl,
      phone,
      openTime,
      closeTime,
    } = parsedBody;

    // 1. Verify admin access
    const { user } = await requireActiveUser(request);
    if (user.role !== "ADMIN") {
      throw new AdminRequiredError();
    }

    // 2. Create branch — convert time strings to Date objects for Prisma Time fields
    const branch = await prisma.branch.create({
      data: {
        nameHi,
        nameEn,
        city,
        address,
        googleMapsUrl: googleMapsUrl || null,
        phone,
        openTime: new Date(`1970-01-01T${openTime}:00`),
        closeTime: new Date(`1970-01-01T${closeTime}:00`),
      },
    });

    // 3. Return with serialized time fields
    return {
      ...branch,
      openTime: branch.openTime.toTimeString().slice(0, 5),
      closeTime: branch.closeTime.toTimeString().slice(0, 5),
    };
  },
});
