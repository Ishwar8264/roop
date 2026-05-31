/**
 * Purpose: Product Category detail, update, and soft-delete API endpoints
 * Responsibility: Get category detail (public), update category (admin), soft-delete category (admin)
 *
 * Endpoints:
 *   GET    /api/product-categories/[id]   — Get product category detail (public)
 *   PATCH  /api/product-categories/[id]   — Update product category (admin only)
 *   DELETE /api/product-categories/[id]   — Soft delete — set isActive=false (admin only)
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
import { updateProductCategorySchema } from "@/lib/validations/product-categories";

// ==================== Helper — extract [id] from URL ====================

function extractIdFromUrl(request: Request): string | null {
  const url = new URL(request.url);
  const segments = url.pathname.split("/");
  const idIndex = segments.indexOf("product-categories") + 1;
  return segments[idIndex] || null;
}

// ==================== GET — Product Category Detail (Public) ====================

export const GET = createApiHandler({
  schema: null,
  handler: async ({ request }) => {
    const id = extractIdFromUrl(request);
    if (!id) {
      throw new NotFoundError("Product category not found");
    }

    const category = await prisma.productCategory.findUnique({
      where: { id },
      include: {
        _count: {
          select: { products: true },
        },
      },
    });

    if (!category) {
      throw new NotFoundError("Product category not found");
    }

    return {
      ...category,
      productsCount: category._count.products,
      _count: undefined,
    };
  },
});

// ==================== PATCH — Update Product Category (Admin) ====================

export const PATCH = createApiHandler({
  schema: updateProductCategorySchema,
  successMessage: "Product category updated successfully",
  handler: async ({ parsedBody, request }) => {
    const id = extractIdFromUrl(request);
    if (!id) {
      throw new NotFoundError("Product category not found");
    }

    // 1. Verify admin access
    const { user } = await requireActiveUser(request);
    if (user.role !== "ADMIN") {
      throw new AdminRequiredError();
    }

    // 2. Check category exists
    const existingCategory = await prisma.productCategory.findUnique({
      where: { id },
    });
    if (!existingCategory) {
      throw new NotFoundError("Product category not found");
    }

    // 3. Check slug uniqueness if slug is being changed
    if (parsedBody.slug && parsedBody.slug !== existingCategory.slug) {
      const slugConflict = await prisma.productCategory.findUnique({
        where: { slug: parsedBody.slug },
      });
      if (slugConflict) {
        throw new ConflictError("A product category with this slug already exists");
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
    const updatedCategory = await prisma.productCategory.update({
      where: { id },
      data: updateData,
    });

    return updatedCategory;
  },
});

// ==================== DELETE — Soft Delete Product Category (Admin) ====================

export const DELETE = createApiHandler({
  schema: null,
  successMessage: "Product category deleted successfully",
  handler: async ({ request }) => {
    const id = extractIdFromUrl(request);
    if (!id) {
      throw new NotFoundError("Product category not found");
    }

    // 1. Verify admin access
    const { user } = await requireActiveUser(request);
    if (user.role !== "ADMIN") {
      throw new AdminRequiredError();
    }

    // 2. Check category exists
    const existingCategory = await prisma.productCategory.findUnique({
      where: { id },
    });
    if (!existingCategory) {
      throw new NotFoundError("Product category not found");
    }

    // 3. Soft delete — set isActive = false
    await prisma.productCategory.update({
      where: { id },
      data: { isActive: false },
    });

    return null;
  },
});
