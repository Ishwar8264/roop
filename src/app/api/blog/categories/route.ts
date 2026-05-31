/**
 * Purpose: Blog categories list and create API endpoints
 * Responsibility: List blog categories (public) and create new categories (admin)
 *
 * Endpoints:
 *   GET  /api/blog/categories  — List active blog categories (public)
 *   POST /api/blog/categories  — Create a new blog category (admin only)
 *
 * GET Query Params:
 *   (none — returns all active categories, ordered by sortOrder)
 *
 * POST Request Body:
 *   nameHi, nameEn, slug, sortOrder (opt, default 0)
 *
 * Responses:
 *   200: { success: true, data: { categories } }
 *   201: { success: true, data: category, message }
 *   400: { success: false, error, message }
 *   403: { success: false, error: "PERM_ADMIN_REQUIRED" }
 *   409: { success: false, error: "RES_CONFLICT" }
 */

import { createApiHandler } from "@/lib/api-handler";
import { prisma } from "@/lib/prisma";
import { requireActiveUser } from "@/lib/auth-helpers";
import { ConflictError, AdminRequiredError } from "@/lib/errors";
import { HTTP_STATUS } from "@/lib/http";
import { createBlogCategorySchema } from "@/lib/validations/blog";

// ==================== GET — List Blog Categories (Public) ====================

export const GET = createApiHandler({
  schema: null,
  handler: async () => {
    // 1. Fetch all active categories with post count
    const categories = await prisma.blogCategory.findMany({
      where: { isActive: true },
      select: {
        id: true,
        nameHi: true,
        nameEn: true,
        slug: true,
        sortOrder: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: { posts: true },
        },
      },
      orderBy: { sortOrder: "asc" },
    });

    // 2. Return categories with post count
    return {
      categories: categories.map((cat) => ({
        ...cat,
        postsCount: cat._count.posts,
        _count: undefined,
      })),
    };
  },
});

// ==================== POST — Create Blog Category (Admin) ====================

export const POST = createApiHandler({
  schema: createBlogCategorySchema,
  successMessage: "Blog category created successfully",
  successStatus: HTTP_STATUS.CREATED,
  handler: async ({ parsedBody, request }) => {
    const { nameHi, nameEn, slug, sortOrder } = parsedBody;

    // 1. Verify admin access
    const { user } = await requireActiveUser(request);
    if (user.role !== "ADMIN") {
      throw new AdminRequiredError();
    }

    // 2. Check slug uniqueness
    const existingSlug = await prisma.blogCategory.findUnique({
      where: { slug },
    });
    if (existingSlug) {
      throw new ConflictError("A blog category with this slug already exists");
    }

    // 3. Create category
    const newCategory = await prisma.blogCategory.create({
      data: {
        nameHi,
        nameEn,
        slug,
        sortOrder,
      },
    });

    return newCategory;
  },
});
