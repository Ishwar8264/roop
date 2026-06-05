/**
 * Purpose: Staff business logic service
 * Responsibility: All staff CRUD operations + service assignment + leave management + reverse lookup
 * Important Notes:
 *   - Business logic lives HERE, NOT in route handlers
 *   - Soft delete only — set isAvailable = false (never hard delete)
 *   - Time handling: "HH:mm" strings ↔ Date objects for Prisma @db.Time(0)
 *   - Date handling: "YYYY-MM-DD" strings ↔ Date objects for Prisma @db.Date
 *   - Decimal handling: rating (3,2), commissionRate (5,2) — convert properly
 *   - Hindi-first user-facing messages in errors
 *   - URL-based ID extraction from request.url pathname
 *   - Staff promotion: USER → STAFF when creating staff profile
 *   - Bulk assign: skip already-assigned services gracefully (no error on duplicates)
 */

import { prisma } from "@/lib/database/prisma";
import { requireAdmin } from "@/lib/server/auth-hooks";
import {
  StaffNotFoundError,
  StaffAlreadyDeactivatedError,
  StaffServiceAlreadyAssignedError,
  StaffLeaveConflictError,
  StaffLeaveNotFoundError,
  UserNotFoundError,
  BranchNotFoundError,
  ServiceNotFoundError,
} from "@/lib/server/errors";
import type {
  StaffResponse,
  StaffDetailResponse,
  StaffListResponse,
  StaffServiceItemResponse,
  StaffLeaveResponse,
  StaffListQuery,
  StaffLeaveListQuery,
  BulkAssignServicesResult,
  WorkDays,
} from "@/features/staff/types";
import type {
  CreateStaffInput,
  UpdateStaffInput,
  AddStaffLeaveInput,
} from "@/features/staff/validations/staff";
import { Prisma } from "@prisma/client";

// Re-export requireAdmin for convenience in route files
export { requireAdmin };

// ==================== TIME/DATE HELPERS ====================

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
 * Extract staff ID from URL pathname
 * Works for /api/staff/[id]/... patterns
 */
export function extractStaffIdFromUrl(url: string): string {
  const pathname = new URL(url).pathname;
  const segments = pathname.split("/").filter(Boolean);
  // /api/staff/[id] → segments: ['api', 'staff', 'id']
  return segments[2] || "";
}

/**
 * Extract service ID from URL pathname for staff service routes
 * Works for /api/staff/[id]/services/[serviceId]
 */
export function extractServiceIdFromStaffUrl(url: string): string {
  const pathname = new URL(url).pathname;
  const segments = pathname.split("/").filter(Boolean);
  // /api/staff/[id]/services/[serviceId] → segments: ['api', 'staff', 'id', 'services', 'serviceId']
  return segments[4] || "";
}

/**
 * Extract leave ID from URL pathname
 * Works for /api/staff/[id]/leaves/[leaveId]
 */
export function extractLeaveIdFromUrl(url: string): string {
  const pathname = new URL(url).pathname;
  const segments = pathname.split("/").filter(Boolean);
  // /api/staff/[id]/leaves/[leaveId] → segments: ['api', 'staff', 'id', 'leaves', 'leaveId']
  return segments[4] || "";
}

/**
 * Extract service ID from URL pathname for service staff routes
 * Works for /api/services/[id]/staff patterns
 */
export function extractServiceIdFromServiceUrl(url: string): string {
  const pathname = new URL(url).pathname;
  const segments = pathname.split("/").filter(Boolean);
  // /api/services/[id]/staff → segments: ['api', 'services', 'id', 'staff']
  return segments[2] || "";
}

// ==================== MAPPER ====================

/** Map Prisma Staff (with user + branch) to list API response */
function mapStaffToResponse(staff: {
  id: string;
  userId: string;
  branchId: string;
  specialization: string[];
  experienceYears: number | null;
  bioHi: string | null;
  bioEn: string | null;
  photoUrl: string | null;
  rating: unknown;
  isAvailable: boolean;
  workDays: unknown;
  workStart: Date;
  workEnd: Date;
  commissionRate: unknown;
  createdAt: Date;
  updatedAt: Date;
  user: { name: string | null; phone: string | null; avatarUrl: string | null };
  branch: { nameHi: string; nameEn: string };
}): StaffResponse {
  return {
    id: staff.id,
    userId: staff.userId,
    branchId: staff.branchId,
    userName: staff.user.name,
    userPhone: staff.user.phone,
    userAvatarUrl: staff.user.avatarUrl,
    branchNameHi: staff.branch.nameHi,
    branchNameEn: staff.branch.nameEn,
    specialization: staff.specialization,
    experienceYears: staff.experienceYears,
    bioHi: staff.bioHi,
    bioEn: staff.bioEn,
    photoUrl: staff.photoUrl,
    rating: decimalToNumber(staff.rating),
    isAvailable: staff.isAvailable,
    workDays: staff.workDays as WorkDays,
    workStart: dateToTimeString(staff.workStart),
    workEnd: dateToTimeString(staff.workEnd),
    commissionRate: decimalToNumberOrNull(staff.commissionRate),
    createdAt: staff.createdAt.toISOString(),
    updatedAt: staff.updatedAt.toISOString(),
  };
}

/** Map Prisma StaffLeave to API response */
function mapLeaveToResponse(leave: {
  id: string;
  staffId: string;
  date: Date;
  reason: string | null;
  createdAt: Date;
}): StaffLeaveResponse {
  return {
    id: leave.id,
    staffId: leave.staffId,
    date: dateToDateString(leave.date),
    reason: leave.reason,
    createdAt: leave.createdAt.toISOString(),
  };
}

// ==================== LIST STAFF ====================

/**
 * List staff with filtering and pagination
 * Public endpoint — no auth required
 */
export async function listStaff(query: StaffListQuery): Promise<StaffListResponse> {
  const { branchId, specialization, isAvailable, page = 1, limit = 20 } = query;

  const where: Prisma.StaffWhereInput = {};

  // Filter by branch
  if (branchId) {
    where.branchId = branchId;
  }

  // Filter by specialization (has array contains)
  if (specialization) {
    where.specialization = { has: specialization };
  }

  // Filter by availability
  if (isAvailable !== undefined) {
    where.isAvailable = isAvailable;
  }

  // Pagination
  const skip = (page - 1) * limit;
  const take = limit;

  const [staffList, total] = await Promise.all([
    prisma.staff.findMany({
      where,
      orderBy: [{ rating: "desc" }, { createdAt: "desc" }],
      skip,
      take,
      include: {
        user: {
          select: { name: true, phone: true, avatarUrl: true },
        },
        branch: {
          select: { nameHi: true, nameEn: true },
        },
      },
    }),
    prisma.staff.count({ where }),
  ]);

  return {
    staff: staffList.map(mapStaffToResponse),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

// ==================== GET STAFF BY ID ====================

/**
 * Get single staff with user info, branch, services, and upcoming leaves
 * Public endpoint — no auth required
 */
export async function getStaffById(id: string): Promise<StaffDetailResponse> {
  const staff = await prisma.staff.findUnique({
    where: { id },
    include: {
      user: {
        select: { name: true, phone: true, avatarUrl: true },
      },
      branch: {
        select: { id: true, nameHi: true, nameEn: true, city: true },
      },
      staffServices: {
        include: {
          service: {
            select: {
              id: true,
              nameHi: true,
              nameEn: true,
              price: true,
              durationMinutes: true,
            },
          },
        },
      },
      leaves: {
        where: {
          date: {
            gte: new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), 1)),
          },
        },
        orderBy: { date: "asc" },
      },
    },
  });

  if (!staff) {
    throw new StaffNotFoundError();
  }

  const { branch, staffServices, leaves, ...staffData } = staff;

  const baseResponse = mapStaffToResponse({ ...staffData, user: staff.user, branch: { nameHi: branch.nameHi, nameEn: branch.nameEn } });

  return {
    ...baseResponse,
    branch: {
      id: branch.id,
      nameHi: branch.nameHi,
      nameEn: branch.nameEn,
      city: branch.city,
    },
    services: staffServices.map((ss) => ({
      id: ss.id,
      serviceId: ss.service.id,
      nameHi: ss.service.nameHi,
      nameEn: ss.service.nameEn,
      price: decimalToNumber(ss.service.price),
      durationMinutes: ss.service.durationMinutes,
    })),
    upcomingLeaves: leaves.map(mapLeaveToResponse),
  };
}

// ==================== CREATE STAFF ====================

/**
 * Create a new staff profile
 * Admin only
 * If user is USER role, promotes to STAFF role
 */
export async function createStaff(data: CreateStaffInput): Promise<StaffResponse> {
  // Verify user exists
  const user = await prisma.user.findUnique({ where: { id: data.userId } });
  if (!user) {
    throw new UserNotFoundError();
  }

  // Verify branch exists
  const branch = await prisma.branch.findUnique({ where: { id: data.branchId } });
  if (!branch) {
    throw new BranchNotFoundError();
  }

  // Check if user already has a staff profile
  const existingStaff = await prisma.staff.findUnique({ where: { userId: data.userId } });
  if (existingStaff) {
    throw new StaffServiceAlreadyAssignedError(); // reuse: user already has staff profile
  }

  // Build workDays JSON with default if not provided
  const workDays = data.workDays ?? {
    mon: true, tue: true, wed: true, thu: true, fri: true, sat: true, sun: false,
  };

  // Create staff profile and potentially promote user role in a transaction
  const staff = await prisma.$transaction(async (tx) => {
    // Promote user to STAFF role if currently USER
    if (user.role === "USER") {
      await tx.user.update({
        where: { id: data.userId },
        data: { role: "STAFF" },
      });
    }

    const newStaff = await tx.staff.create({
      data: {
        userId: data.userId,
        branchId: data.branchId,
        specialization: data.specialization,
        experienceYears: data.experienceYears ?? null,
        bioHi: data.bioHi ?? null,
        bioEn: data.bioEn ?? null,
        photoUrl: data.photoUrl ?? null,
        workDays: workDays as Prisma.JsonObject,
        workStart: timeStringToDate(data.workStart),
        workEnd: timeStringToDate(data.workEnd),
        commissionRate: data.commissionRate ?? null,
      },
      include: {
        user: {
          select: { name: true, phone: true, avatarUrl: true },
        },
        branch: {
          select: { nameHi: true, nameEn: true },
        },
      },
    });

    return newStaff;
  });

  return mapStaffToResponse(staff);
}

// ==================== UPDATE STAFF ====================

/**
 * Update an existing staff profile (partial update)
 * Admin only
 */
export async function updateStaff(id: string, data: UpdateStaffInput): Promise<StaffResponse> {
  // Verify staff exists
  const existing = await prisma.staff.findUnique({ where: { id } });
  if (!existing) {
    throw new StaffNotFoundError();
  }

  // Verify branch exists if being updated
  if (data.branchId) {
    const branch = await prisma.branch.findUnique({ where: { id: data.branchId } });
    if (!branch) {
      throw new BranchNotFoundError();
    }
  }

  // Build update data — only include fields that were provided
  const updateData: Prisma.StaffUpdateInput = {};

  if (data.branchId !== undefined) updateData.branch = { connect: { id: data.branchId } };
  if (data.specialization !== undefined) updateData.specialization = data.specialization;
  if (data.experienceYears !== undefined) updateData.experienceYears = data.experienceYears;
  if (data.bioHi !== undefined) updateData.bioHi = data.bioHi ?? null;
  if (data.bioEn !== undefined) updateData.bioEn = data.bioEn ?? null;
  if (data.photoUrl !== undefined) updateData.photoUrl = data.photoUrl ?? null;
  if (data.workDays !== undefined) updateData.workDays = data.workDays as Prisma.JsonObject;
  if (data.workStart !== undefined) updateData.workStart = timeStringToDate(data.workStart);
  if (data.workEnd !== undefined) updateData.workEnd = timeStringToDate(data.workEnd);
  if (data.commissionRate !== undefined) updateData.commissionRate = data.commissionRate;

  const staff = await prisma.staff.update({
    where: { id },
    data: updateData,
    include: {
      user: {
        select: { name: true, phone: true, avatarUrl: true },
      },
      branch: {
        select: { nameHi: true, nameEn: true },
      },
    },
  });

  return mapStaffToResponse(staff);
}

// ==================== DEACTIVATE STAFF (SOFT DELETE) ====================

/**
 * Soft delete — sets isAvailable = false
 * NEVER hard deletes a staff member
 * Admin only
 */
export async function deactivateStaff(id: string): Promise<StaffResponse> {
  const existing = await prisma.staff.findUnique({ where: { id } });
  if (!existing) {
    throw new StaffNotFoundError();
  }

  if (!existing.isAvailable) {
    throw new StaffAlreadyDeactivatedError();
  }

  const staff = await prisma.staff.update({
    where: { id },
    data: { isAvailable: false },
    include: {
      user: {
        select: { name: true, phone: true, avatarUrl: true },
      },
      branch: {
        select: { nameHi: true, nameEn: true },
      },
    },
  });

  return mapStaffToResponse(staff);
}

// ==================== STAFF SERVICES ====================

/**
 * List services a staff member can perform
 * Public endpoint
 */
export async function listStaffServices(staffId: string): Promise<StaffServiceItemResponse[]> {
  // Verify staff exists
  const staff = await prisma.staff.findUnique({ where: { id: staffId } });
  if (!staff) {
    throw new StaffNotFoundError();
  }

  const staffServices = await prisma.staffService.findMany({
    where: { staffId },
    include: {
      service: {
        select: {
          id: true,
          nameHi: true,
          nameEn: true,
          price: true,
          durationMinutes: true,
        },
      },
    },
    orderBy: { service: { nameEn: "asc" } },
  });

  return staffServices.map((ss) => ({
    id: ss.id,
    serviceId: ss.service.id,
    nameHi: ss.service.nameHi,
    nameEn: ss.service.nameEn,
    price: decimalToNumber(ss.service.price),
    durationMinutes: ss.service.durationMinutes,
  }));
}

/**
 * Bulk assign services to a staff member
 * Admin only
 * Skips already-assigned services gracefully (no error on duplicates)
 */
export async function assignServices(
  staffId: string,
  serviceIds: string[]
): Promise<BulkAssignServicesResult> {
  // Verify staff exists
  const staff = await prisma.staff.findUnique({ where: { id: staffId } });
  if (!staff) {
    throw new StaffNotFoundError();
  }

  // Verify all services exist
  const services = await prisma.service.findMany({
    where: { id: { in: serviceIds } },
    select: { id: true },
  });

  const validServiceIds = new Set(services.map((s) => s.id));
  const invalidServiceIds = serviceIds.filter((id) => !validServiceIds.has(id));

  if (invalidServiceIds.length > 0) {
    throw new ServiceNotFoundError();
  }

  // Find already-assigned services
  const existingAssignments = await prisma.staffService.findMany({
    where: {
      staffId,
      serviceId: { in: serviceIds },
    },
    select: { serviceId: true },
  });

  const alreadyAssigned = new Set(existingAssignments.map((a) => a.serviceId));

  // Filter out already-assigned services
  const newServiceIds = serviceIds.filter((id) => !alreadyAssigned.has(id));

  // Bulk create new assignments
  if (newServiceIds.length > 0) {
    await prisma.staffService.createMany({
      data: newServiceIds.map((serviceId) => ({
        staffId,
        serviceId,
      })),
      skipDuplicates: true, // Extra safety for concurrent requests
    });
  }

  return {
    assigned: newServiceIds.length,
    skipped: alreadyAssigned.size,
    total: serviceIds.length,
  };
}

/**
 * Remove a service assignment from a staff member
 * Admin only
 */
export async function removeStaffService(
  staffId: string,
  serviceId: string
): Promise<{ deleted: boolean }> {
  // Verify the assignment exists and belongs to this staff
  const assignment = await prisma.staffService.findFirst({
    where: { staffId, serviceId },
  });

  if (!assignment) {
    throw new StaffNotFoundError(); // No such assignment
  }

  await prisma.staffService.delete({
    where: { id: assignment.id },
  });

  return { deleted: true };
}

// ==================== STAFF LEAVES ====================

/**
 * List leaves for a staff member with optional year/month filtering
 * Public endpoint
 */
export async function listStaffLeaves(
  staffId: string,
  query: StaffLeaveListQuery
): Promise<StaffLeaveResponse[]> {
  // Verify staff exists
  const staff = await prisma.staff.findUnique({ where: { id: staffId } });
  if (!staff) {
    throw new StaffNotFoundError();
  }

  const where: Prisma.StaffLeaveWhereInput = { staffId };

  if (query.year !== undefined || query.month !== undefined) {
    const year = query.year ?? new Date().getFullYear();
    const month = query.month; // 1-12

    if (month !== undefined) {
      // Filter by specific year + month
      const startDate = new Date(Date.UTC(year, month - 1, 1));
      const endDate = new Date(Date.UTC(year, month, 1));
      where.date = { gte: startDate, lt: endDate };
    } else {
      // Filter by year only
      const startDate = new Date(Date.UTC(year, 0, 1));
      const endDate = new Date(Date.UTC(year + 1, 0, 1));
      where.date = { gte: startDate, lt: endDate };
    }
  }

  const leaves = await prisma.staffLeave.findMany({
    where,
    orderBy: { date: "asc" },
  });

  return leaves.map(mapLeaveToResponse);
}

/**
 * Add a leave for a staff member
 * Admin only
 * Handles unique constraint on [staffId, date]
 */
export async function addStaffLeave(
  staffId: string,
  data: AddStaffLeaveInput
): Promise<StaffLeaveResponse> {
  // Verify staff exists
  const staff = await prisma.staff.findUnique({ where: { id: staffId } });
  if (!staff) {
    throw new StaffNotFoundError();
  }

  // Parse the date string to a Date object for @db.Date
  const dateParts = data.date.split("-").map(Number);
  const leaveDate = new Date(Date.UTC(dateParts[0], dateParts[1] - 1, dateParts[2]));

  try {
    const leave = await prisma.staffLeave.create({
      data: {
        staffId,
        date: leaveDate,
        reason: data.reason ?? null,
      },
    });

    return mapLeaveToResponse(leave);
  } catch (error) {
    // Handle unique constraint violation on [staffId, date]
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw new StaffLeaveConflictError();
    }
    throw error;
  }
}

/**
 * Remove a leave from a staff member
 * Admin only
 */
export async function removeStaffLeave(
  staffId: string,
  leaveId: string
): Promise<{ deleted: boolean }> {
  // Verify the leave exists and belongs to this staff
  const leave = await prisma.staffLeave.findFirst({
    where: { id: leaveId, staffId },
  });

  if (!leave) {
    throw new StaffLeaveNotFoundError();
  }

  await prisma.staffLeave.delete({
    where: { id: leaveId },
  });

  return { deleted: true };
}

// ==================== REVERSE LOOKUP: STAFF BY SERVICE ====================

/**
 * List staff members who can perform a specific service
 * Public endpoint — critical for booking flow
 * User selects service → sees available staff
 */
export async function listStaffByService(serviceId: string): Promise<StaffResponse[]> {
  // Verify service exists
  const service = await prisma.service.findUnique({ where: { id: serviceId } });
  if (!service) {
    throw new ServiceNotFoundError();
  }

  const staffServices = await prisma.staffService.findMany({
    where: { serviceId },
    include: {
      staff: {
        include: {
          user: {
            select: { name: true, phone: true, avatarUrl: true },
          },
          branch: {
            select: { nameHi: true, nameEn: true },
          },
        },
      },
    },
  });

  // Only return available staff
  return staffServices.reduce<StaffResponse[]>(
    (acc, ss) => {
      if (ss.staff.isAvailable) {
        acc.push(mapStaffToResponse(ss.staff));
      }
      return acc;
    },
    [],
  );
}
