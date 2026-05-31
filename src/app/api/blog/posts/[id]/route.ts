/**
 * Purpose: Blog post detail, update, and soft-delete API endpoints
 * Responsibility: Get post detail (public for PUBLISHED, admin for all),
 *                 update post (admin), soft-delete post by setting status=ARCHIVED (admin)
 *
 * Endpoints:
 *   GET    /api/blog/posts/[id]  — Get blog post detail
 *   PATCH  /api/blog/posts/[id]  — Update blog post (admin only)
 *   DELETE /api/blog/posts/[id]  — Soft delete — set status=ARCHIVED (admin only)
 *
 * GET Response:
 *   200: { success: true, data: post }
 *
 * PATCH Request Body:
 *   titleHi (opt), titleEn (opt), slug (opt), contentHi (opt), contentEn (opt),
 *   excerptHi (opt), excerptEn (opt), coverImageUrl (opt), categoryId (opt)
 *
 * DELETE Response:
 *   200: { success: true, data: null, message: "Blog post deleted successfully" }
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
import { updateBlogPostSchema } from "@/lib/validations/blog";

// ==================== Helper — extract [id] from URL ====================

function extractIdFromUrl(request: Request): string | null {
  const url = new URL(request.url);
  const segments = url.pathname.split("/");
  const idIndex = segments.indexOf("posts") + 1;
  return segments[idIndex] || null;
}

// ==================== GET — Blog Post Detail ====================

export const GET = createApiHandler({
  schema: null,
  handler: async ({ request }) => {
    const id = extractIdFromUrl(request);
    if (!id) {
      throw new NotFoundError("Blog post not found");
    }

    // 1. Fetch post
    const post = await prisma.blogPost.findUnique({
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
        author: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
      },
    });

    if (!post) {
      throw new NotFoundError("Blog post not found");
    }

    // 2. Public users can only see PUBLISHED posts; admin can see all
    if (post.status !== "PUBLISHED") {
      try {
        const { user } = await requireActiveUser(request);
        if (user.role !== "ADMIN") {
          throw new NotFoundError("Blog post not found");
        }
      } catch (error) {
        // If it's already a NotFoundError from above, re-throw it
        if (error instanceof NotFoundError) {
          throw error;
        }
        // Otherwise it's an auth error — non-admin can't see non-published
        throw new NotFoundError("Blog post not found");
      }
    }

    return post;
  },
});

// ==================== PATCH — Update Blog Post (Admin) ====================

export const PATCH = createApiHandler({
  schema: updateBlogPostSchema,
  successMessage: "Blog post updated successfully",
  handler: async ({ parsedBody, request }) => {
    const id = extractIdFromUrl(request);
    if (!id) {
      throw new NotFoundError("Blog post not found");
    }

    // 1. Verify admin access
    const { user } = await requireActiveUser(request);
    if (user.role !== "ADMIN") {
      throw new AdminRequiredError();
    }

    // 2. Check post exists
    const existingPost = await prisma.blogPost.findUnique({
      where: { id },
    });
    if (!existingPost) {
      throw new NotFoundError("Blog post not found");
    }

    // 3. Check slug uniqueness if slug is being changed
    if (parsedBody.slug && parsedBody.slug !== existingPost.slug) {
      const slugConflict = await prisma.blogPost.findUnique({
        where: { slug: parsedBody.slug },
      });
      if (slugConflict) {
        throw new ConflictError("A blog post with this slug already exists");
      }
    }

    // 4. Check category exists if categoryId is being changed
    if (parsedBody.categoryId && parsedBody.categoryId !== existingPost.categoryId) {
      const category = await prisma.blogCategory.findUnique({
        where: { id: parsedBody.categoryId },
      });
      if (!category) {
        throw new NotFoundError("Blog category not found");
      }
    }

    // 5. Build update data
    const updateData: Record<string, unknown> = {};
    if (parsedBody.titleHi !== undefined) updateData.titleHi = parsedBody.titleHi;
    if (parsedBody.titleEn !== undefined) updateData.titleEn = parsedBody.titleEn;
    if (parsedBody.slug !== undefined) updateData.slug = parsedBody.slug;
    if (parsedBody.contentHi !== undefined) updateData.contentHi = parsedBody.contentHi;
    if (parsedBody.contentEn !== undefined) updateData.contentEn = parsedBody.contentEn || null;
    if (parsedBody.excerptHi !== undefined) updateData.excerptHi = parsedBody.excerptHi || null;
    if (parsedBody.excerptEn !== undefined) updateData.excerptEn = parsedBody.excerptEn || null;
    if (parsedBody.coverImageUrl !== undefined) updateData.coverImageUrl = parsedBody.coverImageUrl || null;
    if (parsedBody.categoryId !== undefined) updateData.categoryId = parsedBody.categoryId;

    // 6. Update post
    const updatedPost = await prisma.blogPost.update({
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
        author: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
      },
    });

    return updatedPost;
  },
});

// ==================== DELETE — Soft Delete Blog Post (Admin) ====================

export const DELETE = createApiHandler({
  schema: null,
  successMessage: "Blog post deleted successfully",
  handler: async ({ request }) => {
    const id = extractIdFromUrl(request);
    if (!id) {
      throw new NotFoundError("Blog post not found");
    }

    // 1. Verify admin access
    const { user } = await requireActiveUser(request);
    if (user.role !== "ADMIN") {
      throw new AdminRequiredError();
    }

    // 2. Check post exists
    const existingPost = await prisma.blogPost.findUnique({
      where: { id },
    });
    if (!existingPost) {
      throw new NotFoundError("Blog post not found");
    }

    // 3. Soft delete — set status = ARCHIVED
    await prisma.blogPost.update({
      where: { id },
      data: { status: "ARCHIVED" },
    });

    return null;
  },
});
