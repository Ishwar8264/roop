/**
 * Purpose: Branch business logic service
 * Responsibility: All branch CRUD operations + holiday management
 * Important Notes:
 *   - Business logic lives HERE, NOT in route handlers
 *   - Soft delete only — never hard delete branches
 *   - Time handling: "HH:mm" strings ↔ Date objects for Prisma @db.Time(0)
 *   - Holiday unique constraint on [branchId, date] handled gracefully
 *   - Hindi-first user-facing messages in errors
 */

import { prisma } from "@/lib/database/prisma";
import {
  BranchNotFoundError,
  BranchAlreadyInactiveError,
  BranchHolidayConflictError,
  BranchHolidayNotFoundError,
} from "@/lib/server/errors";
import type {
  BranchResponse,
  BranchDetailResponse,
  BranchListResponse,
  BranchHolidayResponse,
  BranchListQuery,
  HolidayListQuery,
} from "@/features/branch/types";
import type { CreateBranchInput, UpdateBranchInput, AddHolidayInput } from "@/features/branch/validations/branch";
import { Prisma } from "@prisma/client";

// Re-export requireAdmin for backward compatibility with existing branch routes
export { requireAdmin } from "@/lib/server/auth-hooks";

// ==================== TIME HELPERS ====================

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

// ==================== URL HELPERS ====================

/**
 * Extract branch ID from URL pathname
 * Works for /api/branches/[id]/... patterns
 */
export function extractBranchIdFromUrl(url: string): string {
  const pathname = new URL(url).pathname;
  const segments = pathname.split("/").filter(Boolean);
  // /api/branches/[id] → segments: ['api', 'branches', 'id']
  return segments[2] || "";
}

/**
 * Extract holiday ID from URL pathname
 * Works for /api/branches/[id]/holidays/[holidayId]
 */
export function extractHolidayIdFromUrl(url: string): string {
  const pathname = new URL(url).pathname;
  const segments = pathname.split("/").filter(Boolean);
  // /api/branches/[id]/holidays/[holidayId] → segments: ['api', 'branches', 'id', 'holidays', 'holidayId']
  return segments[4] || "";
}

// ==================== MAPPER ====================

/** Map Prisma Branch to API response */
function mapBranchToResponse(branch: {
  id: string;
  nameHi: string;
  nameEn: string;
  city: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
  googleMapsUrl: string | null;
  phone: string;
  openTime: Date;
  closeTime: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}): BranchResponse {
  return {
    id: branch.id,
    nameHi: branch.nameHi,
    nameEn: branch.nameEn,
    city: branch.city,
    address: branch.address,
    latitude: branch.latitude,
    longitude: branch.longitude,
    googleMapsUrl: branch.googleMapsUrl,
    phone: branch.phone,
    openTime: dateToTimeString(branch.openTime),
    closeTime: dateToTimeString(branch.closeTime),
    isActive: branch.isActive,
    createdAt: branch.createdAt.toISOString(),
    updatedAt: branch.updatedAt.toISOString(),
  };
}

/** Map Prisma BranchHoliday to API response */
function mapHolidayToResponse(holiday: {
  id: string;
  branchId: string;
  date: Date;
  reasonHi: string;
  reasonEn: string | null;
  createdAt: Date;
}): BranchHolidayResponse {
  return {
    id: holiday.id,
    branchId: holiday.branchId,
    date: dateToDateString(holiday.date),
    reasonHi: holiday.reasonHi,
    reasonEn: holiday.reasonEn,
    createdAt: holiday.createdAt.toISOString(),
  };
}

// ==================== LIST BRANCHES ====================

/**
 * List branches with filtering and pagination
 * Public endpoint — no auth required
 */
export async function listBranches(query: BranchListQuery): Promise<BranchListResponse> {
  const { city, includeInactive = false, page = 1, limit = 20 } = query;

  const where: Prisma.BranchWhereInput = {};

  // Filter by city
  if (city) {
    where.city = { equals: city, mode: "insensitive" };
  }

  // By default, only show active branches
  if (!includeInactive) {
    where.isActive = true;
  }

  // Pagination
  const skip = (page - 1) * limit;
  const take = limit;

  const [branches, total] = await Promise.all([
    prisma.branch.findMany({
      where,
      orderBy: [{ city: "asc" }, { nameEn: "asc" }],
      skip,
      take,
    }),
    prisma.branch.count({ where }),
  ]);

  return {
    branches: branches.map(mapBranchToResponse),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

// ==================== GET BRANCH BY ID ====================

/**
 * Get single branch with holidays for current + next month
 * Public endpoint — no auth required
 */
export async function getBranchById(id: string): Promise<BranchDetailResponse> {
  const branch = await prisma.branch.findUnique({
    where: { id },
    include: {
      holidays: {
        where: {
          date: {
            gte: startOfCurrentMonth(),
            lt: endOfNextMonth(),
          },
        },
        orderBy: { date: "asc" },
      },
    },
  });

  if (!branch) {
    throw new BranchNotFoundError();
  }

  const { holidays, ...branchData } = branch;

  return {
    ...mapBranchToResponse(branchData),
    holidays: holidays.map(mapHolidayToResponse),
  };
}

// ==================== CREATE BRANCH ====================

/**
 * Create a new branch
 * Admin only
 */
export async function createBranch(data: CreateBranchInput): Promise<BranchResponse> {
  const branch = await prisma.branch.create({
    data: {
      nameHi: data.nameHi,
      nameEn: data.nameEn,
      city: data.city,
      address: data.address,
      latitude: data.latitude ?? null,
      longitude: data.longitude ?? null,
      googleMapsUrl: data.googleMapsUrl ?? null,
      phone: data.phone,
      openTime: timeStringToDate(data.openTime),
      closeTime: timeStringToDate(data.closeTime),
    },
  });

  return mapBranchToResponse(branch);
}

// ==================== UPDATE BRANCH ====================

/**
 * Update an existing branch (partial update)
 * Admin only
 */
export async function updateBranch(id: string, data: UpdateBranchInput): Promise<BranchResponse> {
  // Verify branch exists
  const existing = await prisma.branch.findUnique({ where: { id } });
  if (!existing) {
    throw new BranchNotFoundError();
  }

  // Build update data — only include fields that were provided
  const updateData: Prisma.BranchUpdateInput = {};

  if (data.nameHi !== undefined) updateData.nameHi = data.nameHi;
  if (data.nameEn !== undefined) updateData.nameEn = data.nameEn;
  if (data.city !== undefined) updateData.city = data.city;
  if (data.address !== undefined) updateData.address = data.address;
  if (data.latitude !== undefined) updateData.latitude = data.latitude ?? null;
  if (data.longitude !== undefined) updateData.longitude = data.longitude ?? null;
  if (data.googleMapsUrl !== undefined) updateData.googleMapsUrl = data.googleMapsUrl ?? null;
  if (data.phone !== undefined) updateData.phone = data.phone;
  if (data.openTime !== undefined) updateData.openTime = timeStringToDate(data.openTime);
  if (data.closeTime !== undefined) updateData.closeTime = timeStringToDate(data.closeTime);

  const branch = await prisma.branch.update({
    where: { id },
    data: updateData,
  });

  return mapBranchToResponse(branch);
}

// ==================== DEACTIVATE BRANCH (SOFT DELETE) ====================

/**
 * Soft delete — sets isActive = false
 * NEVER hard deletes a branch
 * Admin only
 */
export async function deactivateBranch(id: string): Promise<BranchResponse> {
  const existing = await prisma.branch.findUnique({ where: { id } });
  if (!existing) {
    throw new BranchNotFoundError();
  }

  if (!existing.isActive) {
    throw new BranchAlreadyInactiveError();
  }

  const branch = await prisma.branch.update({
    where: { id },
    data: { isActive: false },
  });

  return mapBranchToResponse(branch);
}

// ==================== TOGGLE BRANCH ACTIVE ====================

/**
 * Toggle branch active status
 * Admin only
 */
export async function toggleBranchActive(id: string): Promise<BranchResponse> {
  const existing = await prisma.branch.findUnique({ where: { id } });
  if (!existing) {
    throw new BranchNotFoundError();
  }

  const branch = await prisma.branch.update({
    where: { id },
    data: { isActive: !existing.isActive },
  });

  return mapBranchToResponse(branch);
}

// ==================== LIST HOLIDAYS ====================

/**
 * List holidays for a branch with optional year/month filtering
 * Public endpoint
 */
export async function listHolidays(
  branchId: string,
  query: HolidayListQuery
): Promise<BranchHolidayResponse[]> {
  // Verify branch exists
  const branch = await prisma.branch.findUnique({ where: { id: branchId } });
  if (!branch) {
    throw new BranchNotFoundError();
  }

  const where: Prisma.BranchHolidayWhereInput = { branchId };

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

  const holidays = await prisma.branchHoliday.findMany({
    where,
    orderBy: { date: "asc" },
  });

  return holidays.map(mapHolidayToResponse);
}

// ==================== ADD HOLIDAY ====================

/**
 * Add a holiday to a branch
 * Admin only
 * Handles unique constraint on [branchId, date]
 */
export async function addHoliday(
  branchId: string,
  data: AddHolidayInput
): Promise<BranchHolidayResponse> {
  // Verify branch exists
  const branch = await prisma.branch.findUnique({ where: { id: branchId } });
  if (!branch) {
    throw new BranchNotFoundError();
  }

  // Parse the date string to a Date object for @db.Date
  const dateParts = data.date.split("-").map(Number);
  const holidayDate = new Date(Date.UTC(dateParts[0], dateParts[1] - 1, dateParts[2]));

  try {
    const holiday = await prisma.branchHoliday.create({
      data: {
        branchId,
        date: holidayDate,
        reasonHi: data.reasonHi,
        reasonEn: data.reasonEn ?? null,
      },
    });

    return mapHolidayToResponse(holiday);
  } catch (error) {
    // Handle unique constraint violation on [branchId, date]
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw new BranchHolidayConflictError();
    }
    throw error;
  }
}

// ==================== REMOVE HOLIDAY ====================

/**
 * Remove a holiday from a branch
 * Admin only
 */
export async function removeHoliday(branchId: string, holidayId: string): Promise<{ deleted: boolean }> {
  // Verify the holiday exists and belongs to this branch
  const holiday = await prisma.branchHoliday.findFirst({
    where: { id: holidayId, branchId },
  });

  if (!holiday) {
    throw new BranchHolidayNotFoundError();
  }

  await prisma.branchHoliday.delete({
    where: { id: holidayId },
  });

  return { deleted: true };
}

// ==================== DATE HELPERS ====================

/** Get start of current month for holiday filtering */
function startOfCurrentMonth(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
}

/** Get end of next month for holiday filtering */
function endOfNextMonth(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 2, 1));
}
