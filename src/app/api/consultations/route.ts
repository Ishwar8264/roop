/**
 * Purpose: Consultations list and create API endpoints
 * Responsibility: List consultations (auth required, role-based) and create new consultations (any authenticated user)
 *
 * Endpoints:
 *   GET  /api/consultations        — List consultations with pagination and filters
 *   POST /api/consultations        — Request a new consultation
 *
 * GET Query Params:
 *   branchId  (optional) — Filter by branch
 *   staffId   (optional) — Filter by assigned staff
 *   status    (optional) — Filter by status: PENDING | COMPLETED | CANCELLED
 *   date      (optional) — Filter by date (YYYY-MM-DD)
 *   page      (default 1) — Page number
 *   pageSize  (default 20, max 100) — Items per page
 *
 * POST Request Body:
 *   branchId, date (YYYY-MM-DD), time (HH:MM), staffId? (optional)
 *
 * Auth:
 *   GET:  Any authenticated user — USER sees own only, ADMIN/STAFF sees all
 *   POST: Any authenticated user
 *
 * Responses:
 *   200: { success: true, data: { consultations, pagination } }
 *   201: { success: true, data: consultation, message }
 *   400: { success: false, error, message }
 *   403: { success: false, error: "PERM_DENIED", message }
 *   404: { success: false, error: "RES_NOT_FOUND", message }
 */

import { createApiHandler } from "@/lib/api-handler";
import { prisma } from "@/lib/prisma";
import { requireActiveUser } from "@/lib/auth-helpers";
import { NotFoundError, ForbiddenError } from "@/lib/errors";
import { HTTP_STATUS } from "@/lib/http";
import {
  createConsultationSchema,
  listConsultationsQuerySchema,
} from "@/lib/validations/consultations";

// ==================== GET — List Consultations (Auth Required) ====================

export const GET = createApiHandler({
  schema: null, // No body — query params parsed manually
  handler: async ({ request }) => {
    // 1. Require authentication
    const { user } = await requireActiveUser(request);

    // 2. Parse and validate query params
    const url = new URL(request.url);
    const queryResult = listConsultationsQuerySchema.safeParse({
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

    // 3. Build where clause — USER sees own only, ADMIN/STAFF sees all
    const where: Record<string, unknown> = {};

    if (user.role === "USER") {
      where.userId = user.id;
    }

    if (branchId) {
      where.branchId = branchId;
    }

    if (staffId) {
      where.staffId = staffId;
    }

    if (status) {
      where.status = status;
    }

    if (date) {
      where.date = new Date(date);
    }

    // 4. Count total matching consultations
    const total = await prisma.consultation.count({ where });

    // 5. Fetch paginated consultations with user and staff details
    const consultations = await prisma.consultation.findMany({
      where,
      select: {
        id: true,
        userId: true,
        bookingId: true,
        staffId: true,
        branchId: true,
        date: true,
        time: true,
        status: true,
        notes: true,
        createdAt: true,
        updatedAt: true,
        user: {
          select: {
            id: true,
            name: true,
            mobile: true,
            email: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    // 6. Enrich with staff info (manual lookup since no Prisma relation)
    const staffIds = consultations
      .map((c) => c.staffId)
      .filter((id): id is string => id !== null);

    const staffMap = new Map<string, {
      id: string;
      specialization: string[];
      bioHi: string | null;
      bioEn: string | null;
      photoUrl: string | null;
      rating: number;
      user: { id: string; name: string | null; avatarUrl: string | null };
    }>();

    if (staffIds.length > 0) {
      const staffRecords = await prisma.staff.findMany({
        where: { id: { in: staffIds } },
        select: {
          id: true,
          specialization: true,
          bioHi: true,
          bioEn: true,
          photoUrl: true,
          rating: true,
          user: {
            select: {
              id: true,
              name: true,
              avatarUrl: true,
            },
          },
        },
      });
      for (const s of staffRecords) {
        staffMap.set(s.id, { ...s, rating: s.rating.toNumber() });
      }
    }

    // 7. Return with pagination
    return {
      consultations: consultations.map((c) => ({
        ...c,
        staff: c.staffId ? staffMap.get(c.staffId) || null : null,
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

// ==================== POST — Create Consultation (Any Authenticated User) ====================

export const POST = createApiHandler({
  schema: createConsultationSchema,
  successMessage: "Consultation requested successfully",
  successStatus: HTTP_STATUS.CREATED,
  handler: async ({ parsedBody, request }) => {
    const { branchId, date, time, staffId } = parsedBody;

    // 1. Require authentication
    const { user } = await requireActiveUser(request);

    // 2. Check branch exists
    const branch = await prisma.branch.findUnique({
      where: { id: branchId },
    });
    if (!branch) {
      throw new NotFoundError("Branch not found");
    }

    // 3. Check staff exists (if provided)
    if (staffId) {
      const staff = await prisma.staff.findUnique({
        where: { id: staffId },
      });
      if (!staff) {
        throw new NotFoundError("Staff not found");
      }
    }

    // 4. Create consultation with status=PENDING
    const consultation = await prisma.consultation.create({
      data: {
        userId: user.id,
        branchId,
        date: new Date(date),
        time: new Date(`1970-01-01T${time}:00`),
        staffId: staffId || null,
        status: "PENDING",
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            mobile: true,
            email: true,
            avatarUrl: true,
          },
        },
      },
    });

    // 5. Return created consultation with staff info
    let staffInfo: Record<string, unknown> | null = null;
    if (consultation.staffId) {
      const staff = await prisma.staff.findUnique({
        where: { id: consultation.staffId },
        select: {
          id: true,
          specialization: true,
          bioHi: true,
          bioEn: true,
          photoUrl: true,
          rating: true,
          user: {
            select: {
              id: true,
              name: true,
              avatarUrl: true,
            },
          },
        },
      });
      if (staff) {
        staffInfo = { ...staff, rating: staff.rating.toNumber() };
      }
    }

    return {
      ...consultation,
      staff: staffInfo,
    };
  },
});
