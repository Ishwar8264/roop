/**
 * Purpose: Service Category detail, update, and soft-delete API endpoints
 * Responsibility: Get category detail (public), update category (admin), soft-delete category (admin)
 *
 * Endpoints:
 *   GET    /api/service-categories/[id]   — Get category detail (public)
 *   PATCH  /api/service-categories/[id]   — Update category (admin only)
 *   DELETE /api/service-categories/[id]   — Soft delete category — set isActive=false (admin only)
 *
 * GET Response:
 *   200: { success: true, data: category }
 *
 * PATCH Request Body:
 *   All fields optional (partial of createCategorySchema)
 *
 * DELETE Response:
 *   200: { success: true, data: null, message: "Service category deleted successfully" }
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
import { updateCategorySchema } from "@/lib/validations/service-categories";

// ==================== Helper — extract [id] from URL ====================

function extractIdFromUrl(request: Request): string | null {
  const url = new URL(request.url);
  const segments = url.pathname.split("/");
  const idIndex = segments.indexOf("service-categories") + 1;
  return segments[idIndex] || null;
}

// ==================== GET — Category Detail (Public) ====================

export const GET = createApiHandler({
  schema: null,
  handler: async ({ request }) => {
    const id = extractIdFromUrl(request);
    if (!id) {
      throw new NotFoundError("Service category not found");
    }

    const category = await prisma.serviceCategory.findUnique({
      where: { id },
      include: {
        _count: {
          select: { services: true },
        },
      },
    });

    if (!category) {
      throw new NotFoundError("Service category not found");
    }

    // Return with services count
    return {
      ...category,
      servicesCount: category._count.services,
      _count: undefined,
    };
  },
});

// ==================== PATCH — Update Category (Admin) ====================

export const PATCH = createApiHandler({
  schema: updateCategorySchema,
  successMessage: "Service category updated successfully",
  handler: async ({ parsedBody, request }) => {
    const id = extractIdFromUrl(request);
    if (!id) {
      throw new NotFoundError("Service category not found");
    }

    // 1. Verify admin access
    const { user } = await requireActiveUser(request);
    if (user.role !== "ADMIN") {
      throw new AdminRequiredError();
    }

    // 2. Check category exists
    const existingCategory = await prisma.serviceCategory.findUnique({
      where: { id },
    });
    if (!existingCategory) {
      throw new NotFoundError("Service category not found");
    }

    // 3. Check slug uniqueness if slug is being changed
    if (parsedBody.slug && parsedBody.slug !== existingCategory.slug) {
      const slugConflict = await prisma.serviceCategory.findUnique({
        where: { slug: parsedBody.slug },
      });
      if (slugConflict) {
        throw new ConflictError("A service category with this slug already exists");
      }
    }

    // 4. Build update data — only include fields that are provided
    const updateData: Record<string, unknown> = {};

    if (parsedBody.nameHi !== undefined) updateData.nameHi = parsedBody.nameHi;
    if (parsedBody.nameEn !== undefined) updateData.nameEn = parsedBody.nameEn;
    if (parsedBody.slug !== undefined) updateData.slug = parsedBody.slug;
    if (parsedBody.icon !== undefined) updateData.icon = parsedBody.icon || null;
    if (parsedBody.sortOrder !== undefined) updateData.sortOrder = parsedBody.sortOrder;

    // 5. Update category
    const updatedCategory = await prisma.serviceCategory.update({
      where: { id },
      data: updateData,
    });

    // 6. Return updated category
    return updatedCategory;
  },
});

// ==================== DELETE — Soft Delete Category (Admin) ====================

export const DELETE = createApiHandler({
  schema: null,
  successMessage: "Service category deleted successfully",
  handler: async ({ request }) => {
    const id = extractIdFromUrl(request);
    if (!id) {
      throw new NotFoundError("Service category not found");
    }

    // 1. Verify admin access
    const { user } = await requireActiveUser(request);
    if (user.role !== "ADMIN") {
      throw new AdminRequiredError();
    }

    // 2. Check category exists
    const existingCategory = await prisma.serviceCategory.findUnique({
      where: { id },
    });
    if (!existingCategory) {
      throw new NotFoundError("Service category not found");
    }

    // 3. Soft delete — set isActive = false
    await prisma.serviceCategory.update({
      where: { id },
      data: { isActive: false },
    });

    return null;
  },
});
