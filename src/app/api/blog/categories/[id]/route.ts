/**
 * Purpose: Blog category detail, update, and soft-delete API endpoints
 * Responsibility: Update category (admin), soft-delete category (admin)
 *
 * Endpoints:
 *   PATCH  /api/blog/categories/[id]  — Update blog category (admin only)
 *   DELETE /api/blog/categories/[id]  — Soft delete category — set isActive=false (admin only)
 *
 * PATCH Request Body:
 *   nameHi (opt), nameEn (opt), slug (opt), sortOrder (opt)
 *
 * DELETE Response:
 *   200: { success: true, data: null, message: "Blog category deleted successfully" }
 *
 * Error Responses:
 *   403: { success: false, error: "PERM_ADMIN_REQUIRED" }
 *   404: { success: false, error: "RES_NOT_FOUND" }
 *   409: { success: false, error: "RES_CONFLICT" }
 */

import { createApiHandler } from "@/lib/api-handler";
import { prisma } from "@/lib/prisma";
import { requireActiveUser } from "@/lib/auth-helpers";
import { NotFoundError, ConflictError, AdminRequiredError } from "@/lib/errors";
import { updateBlogCategorySchema } from "@/lib/validations/blog";

// ==================== Helper — extract [id] from URL ====================

function extractIdFromUrl(request: Request): string | null {
  const url = new URL(request.url);
  const segments = url.pathname.split("/");
  const idIndex = segments.indexOf("categories") + 1;
  return segments[idIndex] || null;
}

// ==================== PATCH — Update Blog Category (Admin) ====================

export const PATCH = createApiHandler({
  schema: updateBlogCategorySchema,
  successMessage: "Blog category updated successfully",
  handler: async ({ parsedBody, request }) => {
    const id = extractIdFromUrl(request);
    if (!id) {
      throw new NotFoundError("Blog category not found");
    }

    // 1. Verify admin access
    const { user } = await requireActiveUser(request);
    if (user.role !== "ADMIN") {
      throw new AdminRequiredError();
    }

    // 2. Check category exists
    const existingCategory = await prisma.blogCategory.findUnique({
      where: { id },
    });
    if (!existingCategory) {
      throw new NotFoundError("Blog category not found");
    }

    // 3. Check slug uniqueness if slug is being changed
    if (parsedBody.slug && parsedBody.slug !== existingCategory.slug) {
      const slugConflict = await prisma.blogCategory.findUnique({
        where: { slug: parsedBody.slug },
      });
      if (slugConflict) {
        throw new ConflictError("A blog category with this slug already exists");
      }
    }

    // 4. Build update data
    const updateData: Record<string, unknown> = {};
    if (parsedBody.nameHi !== undefined) updateData.nameHi = parsedBody.nameHi;
    if (parsedBody.nameEn !== undefined) updateData.nameEn = parsedBody.nameEn;
    if (parsedBody.slug !== undefined) updateData.slug = parsedBody.slug;
    if (parsedBody.sortOrder !== undefined) updateData.sortOrder = parsedBody.sortOrder;

    // 5. Update category
    const updatedCategory = await prisma.blogCategory.update({
      where: { id },
      data: updateData,
    });

    return updatedCategory;
  },
});

// ==================== DELETE — Soft Delete Blog Category (Admin) ====================

export const DELETE = createApiHandler({
  schema: null,
  successMessage: "Blog category deleted successfully",
  handler: async ({ request }) => {
    const id = extractIdFromUrl(request);
    if (!id) {
      throw new NotFoundError("Blog category not found");
    }

    // 1. Verify admin access
    const { user } = await requireActiveUser(request);
    if (user.role !== "ADMIN") {
      throw new AdminRequiredError();
    }

    // 2. Check category exists
    const existingCategory = await prisma.blogCategory.findUnique({
      where: { id },
    });
    if (!existingCategory) {
      throw new NotFoundError("Blog category not found");
    }

    // 3. Soft delete — set isActive = false
    await prisma.blogCategory.update({
      where: { id },
      data: { isActive: false },
    });

    return null;
  },
});
