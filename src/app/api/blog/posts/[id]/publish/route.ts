/**
 * Purpose: Blog post publish API endpoint
 * Responsibility: Publish a blog post — set status=PUBLISHED and publishedAt=now (admin only)
 *
 * Endpoints:
 *   PATCH /api/blog/posts/[id]/publish  — Publish a blog post (admin only)
 *
 * PATCH Response:
 *   200: { success: true, data: post, message: "Blog post published successfully" }
 *
 * Error Responses:
 *   403: { success: false, error: "PERM_ADMIN_REQUIRED" }
 *   404: { success: false, error: "RES_NOT_FOUND" }
 *   409: { success: false, error: "RES_CONFLICT" } — post already published
 */

import { createApiHandler } from "@/lib/api-handler";
import { prisma } from "@/lib/prisma";
import { requireActiveUser } from "@/lib/auth-helpers";
import { NotFoundError, ConflictError, AdminRequiredError } from "@/lib/errors";

// ==================== Helper — extract [id] from URL ====================

function extractIdFromUrl(request: Request): string | null {
  const url = new URL(request.url);
  const segments = url.pathname.split("/");
  const idIndex = segments.indexOf("posts") + 1;
  return segments[idIndex] || null;
}

// ==================== PATCH — Publish Blog Post (Admin) ====================

export const PATCH = createApiHandler({
  schema: null,
  successMessage: "Blog post published successfully",
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

    // 3. Check if already published
    if (existingPost.status === "PUBLISHED") {
      throw new ConflictError("Blog post is already published");
    }

    // 4. Check if archived — can't publish archived posts (should unarchive first)
    if (existingPost.status === "ARCHIVED") {
      throw new ConflictError("Cannot publish an archived post. Update the post status to DRAFT first.");
    }

    // 5. Publish — set status=PUBLISHED and publishedAt=now
    const publishedPost = await prisma.blogPost.update({
      where: { id },
      data: {
        status: "PUBLISHED",
        publishedAt: new Date(),
      },
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

    return publishedPost;
  },
});
