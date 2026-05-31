/**
 * Purpose: Staff detail, update, and soft-delete API endpoints
 * Responsibility: Get staff detail (public), update staff (admin), soft-delete staff (admin)
 *
 * Endpoints:
 *   GET    /api/staff/[id]    — Get staff profile detail (public)
 *   PATCH  /api/staff/[id]    — Update staff profile (admin only)
 *   DELETE /api/staff/[id]    — Soft delete staff — set isAvailable=false (admin only)
 *
 * GET Response:
 *   200: { success: true, data: staff } — Full staff profile with user and branch info
 *
 * PATCH Request Body:
 *   All fields optional (partial of updateStaffSchema, userId is immutable)
 *
 * DELETE Response:
 *   200: { success: true, data: null, message }
 *
 * Error Responses:
 *   403: { success: false, error: "PERM_ADMIN_REQUIRED" }
 *   404: { success: false, error: "RES_NOT_FOUND" }
 */

import { createApiHandler } from "@/lib/api-handler";
import { prisma } from "@/lib/prisma";
import { requireActiveUser } from "@/lib/auth-helpers";
import { NotFoundError, AdminRequiredError } from "@/lib/errors";
import { updateStaffSchema } from "@/lib/validations/staff";

// ==================== Helper — extract [id] from URL ====================

function extractIdFromUrl(request: Request): string | null {
  const url = new URL(request.url);
  const segments = url.pathname.split("/");
  const idIndex = segments.indexOf("staff") + 1;
  return segments[idIndex] || null;
}

// ==================== GET — Staff Detail (Public) ====================

export const GET = createApiHandler({
  schema: null,
  handler: async ({ request }) => {
    const id = extractIdFromUrl(request);
    if (!id) {
      throw new NotFoundError("Staff not found");
    }

    const staff = await prisma.staff.findUnique({
      where: { id },
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
        staffServices: {
          include: {
            service: {
              select: {
                id: true,
                nameHi: true,
                nameEn: true,
                price: true,
                durationMinutes: true,
                imageUrl: true,
                isActive: true,
              },
            },
          },
        },
        leaves: {
          orderBy: { date: "desc" },
          take: 30,
        },
        _count: {
          select: { bookings: true, reviews: true },
        },
      },
    });

    if (!staff) {
      throw new NotFoundError("Staff not found");
    }

    // Return with serialized decimal values
    return {
      ...staff,
      rating: staff.rating.toString(),
      commissionRate: staff.commissionRate
        ? staff.commissionRate.toString()
        : null,
      staffServices: staff.staffServices.map((ss) => ({
        ...ss,
        service: {
          ...ss.service,
          price: ss.service.price.toString(),
        },
      })),
      leaves: staff.leaves.map((l) => ({
        ...l,
        date: l.date.toISOString().split("T")[0],
      })),
      bookingsCount: staff._count.bookings,
      reviewsCount: staff._count.reviews,
      _count: undefined,
    };
  },
});

// ==================== PATCH — Update Staff (Admin) ====================

export const PATCH = createApiHandler({
  schema: updateStaffSchema,
  successMessage: "Staff profile updated successfully",
  handler: async ({ parsedBody, request }) => {
    const id = extractIdFromUrl(request);
    if (!id) {
      throw new NotFoundError("Staff not found");
    }

    // 1. Verify admin access
    const { user } = await requireActiveUser(request);
    if (user.role !== "ADMIN") {
      throw new AdminRequiredError();
    }

    // 2. Check staff exists
    const existingStaff = await prisma.staff.findUnique({
      where: { id },
    });
    if (!existingStaff) {
      throw new NotFoundError("Staff not found");
    }

    // 3. Build update data — only include fields that are provided
    const updateData: Record<string, unknown> = {};

    if (parsedBody.branchId !== undefined) updateData.branchId = parsedBody.branchId;
    if (parsedBody.specialization !== undefined) updateData.specialization = parsedBody.specialization;
    if (parsedBody.experienceYears !== undefined) updateData.experienceYears = parsedBody.experienceYears;
    if (parsedBody.bioHi !== undefined) updateData.bioHi = parsedBody.bioHi || null;
    if (parsedBody.bioEn !== undefined) updateData.bioEn = parsedBody.bioEn || null;
    if (parsedBody.photoUrl !== undefined) updateData.photoUrl = parsedBody.photoUrl || null;
    if (parsedBody.isAvailable !== undefined) updateData.isAvailable = parsedBody.isAvailable;
    if (parsedBody.commissionRate !== undefined) updateData.commissionRate = parsedBody.commissionRate ? parseFloat(parsedBody.commissionRate) : null;

    // Handle time fields — convert HH:MM string to DateTime object
    if (parsedBody.workStart !== undefined) {
      updateData.workStart = new Date(`1970-01-01T${parsedBody.workStart}:00`);
    }
    if (parsedBody.workEnd !== undefined) {
      updateData.workEnd = new Date(`1970-01-01T${parsedBody.workEnd}:00`);
    }

    // 4. Update staff
    const updatedStaff = await prisma.staff.update({
      where: { id },
      data: updateData,
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

    // 5. Return updated staff with serialized decimals
    return {
      ...updatedStaff,
      rating: updatedStaff.rating.toString(),
      commissionRate: updatedStaff.commissionRate
        ? updatedStaff.commissionRate.toString()
        : null,
    };
  },
});

// ==================== DELETE — Soft Delete Staff (Admin) ====================

export const DELETE = createApiHandler({
  schema: null,
  successMessage: "Staff profile deactivated successfully",
  handler: async ({ request }) => {
    const id = extractIdFromUrl(request);
    if (!id) {
      throw new NotFoundError("Staff not found");
    }

    // 1. Verify admin access
    const { user } = await requireActiveUser(request);
    if (user.role !== "ADMIN") {
      throw new AdminRequiredError();
    }

    // 2. Check staff exists
    const existingStaff = await prisma.staff.findUnique({
      where: { id },
    });
    if (!existingStaff) {
      throw new NotFoundError("Staff not found");
    }

    // 3. Soft delete — set isAvailable = false
    await prisma.staff.update({
      where: { id },
      data: { isAvailable: false },
    });

    return null;
  },
});
