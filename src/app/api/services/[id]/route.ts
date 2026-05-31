/**
 * Purpose: Service detail, update, and soft-delete API endpoints
 * Responsibility: Get service detail with variants+addons (public), update service (admin), soft-delete service (admin)
 *
 * Endpoints:
 *   GET    /api/services/[id]   — Get service detail with variants and addons (public)
 *   PATCH  /api/services/[id]   — Update service (admin only)
 *   DELETE /api/services/[id]   — Soft delete service — set isActive=false (admin only)
 *
 * GET Response:
 *   200: { success: true, data: service } — Full service with variants and addons
 *
 * PATCH Request Body:
 *   All fields optional (partial of createServiceSchema)
 *
 * DELETE Response:
 *   200: { success: true, data: null, message: "Service deleted successfully" }
 *
 * Error Responses:
 *   403: { success: false, error: "PERM_ADMIN_REQUIRED" }
 *   404: { success: false, error: "RES_NOT_FOUND" }
 *   409: { success: false, error: "RES_CONFLICT" } — slug conflict
 */

import { createApiHandler } from "@/lib/api-handler";
import { prisma } from "@/lib/prisma";
import { requireActiveUser } from "@/lib/auth-helpers";
import { NotFoundError, ConflictError, AdminRequiredError } from "@/lib/errors";
import { updateServiceSchema } from "@/lib/validations/services";

// ==================== Helper — extract [id] from URL ====================

function extractIdFromUrl(request: Request): string | null {
  const url = new URL(request.url);
  const segments = url.pathname.split("/");
  const idIndex = segments.indexOf("services") + 1;
  return segments[idIndex] || null;
}

// ==================== GET — Service Detail (Public) ====================

export const GET = createApiHandler({
  schema: null,
  handler: async ({ request }) => {
    const id = extractIdFromUrl(request);
    if (!id) {
      throw new NotFoundError("Service not found");
    }

    const service = await prisma.service.findUnique({
      where: { id },
      include: {
        branch: {
          select: { id: true, nameHi: true, nameEn: true },
        },
        category: {
          select: { id: true, nameHi: true, nameEn: true, slug: true },
        },
        variants: {
          where: { isActive: true },
          orderBy: { sortOrder: "asc" },
        },
        addOns: {
          where: { isActive: true },
        },
      },
    });

    if (!service) {
      throw new NotFoundError("Service not found");
    }

    // Return with serialized decimal values
    return {
      ...service,
      price: service.price.toString(),
      variants: service.variants.map((v) => ({
        ...v,
        price: v.price.toString(),
      })),
      addOns: service.addOns.map((a) => ({
        ...a,
        price: a.price.toString(),
      })),
    };
  },
});

// ==================== PATCH — Update Service (Admin) ====================

export const PATCH = createApiHandler({
  schema: updateServiceSchema,
  successMessage: "Service updated successfully",
  handler: async ({ parsedBody, request }) => {
    const id = extractIdFromUrl(request);
    if (!id) {
      throw new NotFoundError("Service not found");
    }

    // 1. Verify admin access
    const { user } = await requireActiveUser(request);
    if (user.role !== "ADMIN") {
      throw new AdminRequiredError();
    }

    // 2. Check service exists
    const existingService = await prisma.service.findUnique({
      where: { id },
    });
    if (!existingService) {
      throw new NotFoundError("Service not found");
    }

    // 3. Check slug uniqueness if slug is being changed
    if (parsedBody.slug && parsedBody.slug !== existingService.slug) {
      const slugConflict = await prisma.service.findUnique({
        where: { slug: parsedBody.slug },
      });
      if (slugConflict) {
        throw new ConflictError("A service with this slug already exists");
      }
    }

    // 4. Check branch exists if being changed
    if (parsedBody.branchId) {
      const branch = await prisma.branch.findUnique({
        where: { id: parsedBody.branchId },
      });
      if (!branch) {
        throw new NotFoundError("Branch not found");
      }
    }

    // 5. Check category exists if being changed
    if (parsedBody.categoryId) {
      const category = await prisma.serviceCategory.findUnique({
        where: { id: parsedBody.categoryId },
      });
      if (!category) {
        throw new NotFoundError("Service category not found");
      }
    }

    // 6. Build update data — only include fields that are provided
    const updateData: Record<string, unknown> = {};

    if (parsedBody.nameHi !== undefined) updateData.nameHi = parsedBody.nameHi;
    if (parsedBody.nameEn !== undefined) updateData.nameEn = parsedBody.nameEn;
    if (parsedBody.slug !== undefined) updateData.slug = parsedBody.slug;
    if (parsedBody.descriptionHi !== undefined) updateData.descriptionHi = parsedBody.descriptionHi;
    if (parsedBody.descriptionEn !== undefined) updateData.descriptionEn = parsedBody.descriptionEn || null;
    if (parsedBody.descriptionHtml !== undefined) updateData.descriptionHtml = parsedBody.descriptionHtml || null;
    if (parsedBody.price !== undefined) updateData.price = parseFloat(parsedBody.price);
    if (parsedBody.durationMinutes !== undefined) updateData.durationMinutes = parsedBody.durationMinutes;
    if (parsedBody.imageUrl !== undefined) updateData.imageUrl = parsedBody.imageUrl || null;
    if (parsedBody.branchId !== undefined) updateData.branchId = parsedBody.branchId;
    if (parsedBody.categoryId !== undefined) updateData.categoryId = parsedBody.categoryId;

    // 7. Update service
    const updatedService = await prisma.service.update({
      where: { id },
      data: updateData,
      include: {
        branch: {
          select: { id: true, nameHi: true, nameEn: true },
        },
        category: {
          select: { id: true, nameHi: true, nameEn: true, slug: true },
        },
        variants: {
          where: { isActive: true },
          orderBy: { sortOrder: "asc" },
        },
        addOns: {
          where: { isActive: true },
        },
      },
    });

    // 8. Return updated service with serialized decimals
    return {
      ...updatedService,
      price: updatedService.price.toString(),
      variants: updatedService.variants.map((v) => ({
        ...v,
        price: v.price.toString(),
      })),
      addOns: updatedService.addOns.map((a) => ({
        ...a,
        price: a.price.toString(),
      })),
    };
  },
});

// ==================== DELETE — Soft Delete Service (Admin) ====================

export const DELETE = createApiHandler({
  schema: null,
  successMessage: "Service deleted successfully",
  handler: async ({ request }) => {
    const id = extractIdFromUrl(request);
    if (!id) {
      throw new NotFoundError("Service not found");
    }

    // 1. Verify admin access
    const { user } = await requireActiveUser(request);
    if (user.role !== "ADMIN") {
      throw new AdminRequiredError();
    }

    // 2. Check service exists
    const existingService = await prisma.service.findUnique({
      where: { id },
    });
    if (!existingService) {
      throw new NotFoundError("Service not found");
    }

    // 3. Soft delete — set isActive = false
    await prisma.service.update({
      where: { id },
      data: { isActive: false },
    });

    return null;
  },
});
