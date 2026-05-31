/**
 * Purpose: Product detail, update, and soft-delete API endpoints
 * Responsibility: Get product detail (public), update product (admin), soft-delete product (admin)
 *
 * Endpoints:
 *   GET    /api/products/[id]   — Get product detail with category (public)
 *   PATCH  /api/products/[id]   — Update product (admin only)
 *   DELETE /api/products/[id]   — Soft delete — set isActive=false (admin only)
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
import { updateProductSchema } from "@/lib/validations/products";

// ==================== Helper — extract [id] from URL ====================

function extractIdFromUrl(request: Request): string | null {
  const url = new URL(request.url);
  const segments = url.pathname.split("/");
  const idIndex = segments.indexOf("products") + 1;
  return segments[idIndex] || null;
}

// ==================== GET — Product Detail (Public) ====================

export const GET = createApiHandler({
  schema: null,
  handler: async ({ request }) => {
    const id = extractIdFromUrl(request);
    if (!id) {
      throw new NotFoundError("Product not found");
    }

    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        category: {
          select: {
            id: true,
            nameHi: true,
            nameEn: true,
            slug: true,
          },
        },
      },
    });

    if (!product) {
      throw new NotFoundError("Product not found");
    }

    // Return with serialized decimal values
    return {
      ...product,
      price: product.price.toString(),
      costPrice: product.costPrice?.toString() ?? null,
    };
  },
});

// ==================== PATCH — Update Product (Admin) ====================

export const PATCH = createApiHandler({
  schema: updateProductSchema,
  successMessage: "Product updated successfully",
  handler: async ({ parsedBody, request }) => {
    const id = extractIdFromUrl(request);
    if (!id) {
      throw new NotFoundError("Product not found");
    }

    // 1. Verify admin access
    const { user } = await requireActiveUser(request);
    if (user.role !== "ADMIN") {
      throw new AdminRequiredError();
    }

    // 2. Check product exists
    const existingProduct = await prisma.product.findUnique({
      where: { id },
    });
    if (!existingProduct) {
      throw new NotFoundError("Product not found");
    }

    // 3. Check slug uniqueness if slug is being changed
    if (parsedBody.slug && parsedBody.slug !== existingProduct.slug) {
      const slugConflict = await prisma.product.findUnique({
        where: { slug: parsedBody.slug },
      });
      if (slugConflict) {
        throw new ConflictError("A product with this slug already exists");
      }
    }

    // 4. Check category exists if being changed
    if (parsedBody.categoryId && parsedBody.categoryId !== existingProduct.categoryId) {
      const category = await prisma.productCategory.findUnique({
        where: { id: parsedBody.categoryId },
      });
      if (!category) {
        throw new NotFoundError("Product category not found");
      }
    }

    // 5. Build update data — only include fields that are provided
    const updateData: Record<string, unknown> = {};
    if (parsedBody.nameHi !== undefined) updateData.nameHi = parsedBody.nameHi;
    if (parsedBody.nameEn !== undefined) updateData.nameEn = parsedBody.nameEn;
    if (parsedBody.slug !== undefined) updateData.slug = parsedBody.slug;
    if (parsedBody.descriptionHi !== undefined) updateData.descriptionHi = parsedBody.descriptionHi || null;
    if (parsedBody.descriptionEn !== undefined) updateData.descriptionEn = parsedBody.descriptionEn || null;
    if (parsedBody.price !== undefined) updateData.price = parseFloat(parsedBody.price);
    if (parsedBody.costPrice !== undefined) updateData.costPrice = parsedBody.costPrice ? parseFloat(parsedBody.costPrice) : null;
    if (parsedBody.imageUrl !== undefined) updateData.imageUrl = parsedBody.imageUrl || null;
    if (parsedBody.categoryId !== undefined) updateData.categoryId = parsedBody.categoryId;

    // 6. Update product
    const updatedProduct = await prisma.product.update({
      where: { id },
      data: updateData,
      include: {
        category: {
          select: {
            id: true,
            nameHi: true,
            nameEn: true,
            slug: true,
          },
        },
      },
    });

    // 7. Return updated product with serialized decimals
    return {
      ...updatedProduct,
      price: updatedProduct.price.toString(),
      costPrice: updatedProduct.costPrice?.toString() ?? null,
    };
  },
});

// ==================== DELETE — Soft Delete Product (Admin) ====================

export const DELETE = createApiHandler({
  schema: null,
  successMessage: "Product deleted successfully",
  handler: async ({ request }) => {
    const id = extractIdFromUrl(request);
    if (!id) {
      throw new NotFoundError("Product not found");
    }

    // 1. Verify admin access
    const { user } = await requireActiveUser(request);
    if (user.role !== "ADMIN") {
      throw new AdminRequiredError();
    }

    // 2. Check product exists
    const existingProduct = await prisma.product.findUnique({
      where: { id },
    });
    if (!existingProduct) {
      throw new NotFoundError("Product not found");
    }

    // 3. Soft delete — set isActive = false
    await prisma.product.update({
      where: { id },
      data: { isActive: false },
    });

    return null;
  },
});
