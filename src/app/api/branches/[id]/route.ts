/**
 * Purpose: Branch detail, update, and soft-delete API endpoints
 * Responsibility: Get branch detail (public), update branch (admin), soft-delete branch (admin)
 *
 * Endpoints:
 *   GET    /api/branches/[id]  — Get branch detail with holidays (public)
 *   PATCH  /api/branches/[id]  — Update branch (admin only)
 *   DELETE /api/branches/[id]  — Soft delete branch — set isActive=false (admin only)
 */

import { createApiHandler } from "@/lib/api-handler";
import { prisma } from "@/lib/prisma";
import { requireActiveUser } from "@/lib/auth-helpers";
import { NotFoundError, AdminRequiredError } from "@/lib/errors";
import { updateBranchSchema } from "@/lib/validations/branches";

// ==================== Helper — extract [id] from URL ====================

function extractIdFromUrl(request: Request): string | null {
  const url = new URL(request.url);
  const segments = url.pathname.split("/");
  const idIndex = segments.indexOf("branches") + 1;
  return segments[idIndex] || null;
}

// ==================== GET — Branch Detail (Public) ====================

export const GET = createApiHandler({
  schema: null,
  handler: async ({ request }) => {
    const id = extractIdFromUrl(request);
    if (!id) {
      throw new NotFoundError("Branch not found");
    }

    const branch = await prisma.branch.findUnique({
      where: { id },
      include: {
        holidays: {
          orderBy: { date: "asc" },
        },
      },
    });

    if (!branch) {
      throw new NotFoundError("Branch not found");
    }

    // Return with serialized time fields
    return {
      ...branch,
      openTime: branch.openTime.toTimeString().slice(0, 5),
      closeTime: branch.closeTime.toTimeString().slice(0, 5),
      holidays: branch.holidays.map((h) => ({
        ...h,
        date: h.date.toISOString().slice(0, 10),
      })),
    };
  },
});

// ==================== PATCH — Update Branch (Admin) ====================

export const PATCH = createApiHandler({
  schema: updateBranchSchema,
  successMessage: "Branch updated successfully",
  handler: async ({ parsedBody, request }) => {
    const id = extractIdFromUrl(request);
    if (!id) {
      throw new NotFoundError("Branch not found");
    }

    // 1. Verify admin access
    const { user } = await requireActiveUser(request);
    if (user.role !== "ADMIN") {
      throw new AdminRequiredError();
    }

    // 2. Check branch exists
    const existing = await prisma.branch.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundError("Branch not found");
    }

    // 3. Build update data — only include fields that are provided
    const updateData: Record<string, unknown> = {};

    if (parsedBody.nameHi !== undefined) updateData.nameHi = parsedBody.nameHi;
    if (parsedBody.nameEn !== undefined) updateData.nameEn = parsedBody.nameEn;
    if (parsedBody.city !== undefined) updateData.city = parsedBody.city;
    if (parsedBody.address !== undefined) updateData.address = parsedBody.address;
    if (parsedBody.googleMapsUrl !== undefined) updateData.googleMapsUrl = parsedBody.googleMapsUrl || null;
    if (parsedBody.phone !== undefined) updateData.phone = parsedBody.phone;
    if (parsedBody.openTime !== undefined) updateData.openTime = new Date(`1970-01-01T${parsedBody.openTime}:00`);
    if (parsedBody.closeTime !== undefined) updateData.closeTime = new Date(`1970-01-01T${parsedBody.closeTime}:00`);

    // 4. Update branch
    const updated = await prisma.branch.update({
      where: { id },
      data: updateData,
    });

    // 5. Return with serialized time fields
    return {
      ...updated,
      openTime: updated.openTime.toTimeString().slice(0, 5),
      closeTime: updated.closeTime.toTimeString().slice(0, 5),
    };
  },
});

// ==================== DELETE — Soft Delete Branch (Admin) ====================

export const DELETE = createApiHandler({
  schema: null,
  successMessage: "Branch deleted successfully",
  handler: async ({ request }) => {
    const id = extractIdFromUrl(request);
    if (!id) {
      throw new NotFoundError("Branch not found");
    }

    // 1. Verify admin access
    const { user } = await requireActiveUser(request);
    if (user.role !== "ADMIN") {
      throw new AdminRequiredError();
    }

    // 2. Check branch exists
    const existing = await prisma.branch.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundError("Branch not found");
    }

    // 3. Soft delete — set isActive = false
    await prisma.branch.update({
      where: { id },
      data: { isActive: false },
    });

    return null;
  },
});
