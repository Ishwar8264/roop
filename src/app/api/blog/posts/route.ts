/**
 * Purpose: Blog posts list and create API endpoints
 * Responsibility: List blog posts (public sees PUBLISHED only, admin sees all) and create posts (admin)
 *
 * Endpoints:
 *   GET  /api/blog/posts  — List blog posts with pagination and filters
 *   POST /api/blog/posts  — Create a new blog post (admin only)
 *
 * GET Query Params:
 *   categoryId (optional) — Filter by category
 *   status     (optional, admin only) — Filter by status (DRAFT | PUBLISHED | ARCHIVED)
 *   page       (default 1) — Page number
 *   pageSize   (default 20, max 100) — Items per page
 *
 * POST Request Body:
 *   titleHi, titleEn, slug, contentHi, contentEn (opt), excerptHi (opt),
 *   excerptEn (opt), coverImageUrl (opt), categoryId, authorId (opt, defaults to current user)
 *
 * Responses:
 *   200: { success: true, data: { items, pagination } }
 *   201: { success: true, data: post, message }
 *   400: { success: false, error, message }
 *   403: { success: false, error: "PERM_ADMIN_REQUIRED" }
 *   409: { success: false, error: "RES_CONFLICT" }
 */

import { createApiHandler } from "@/lib/api-handler";
import { prisma } from "@/lib/prisma";
import { requireActiveUser } from "@/lib/auth-helpers";
import { NotFoundError, ConflictError, AdminRequiredError } from "@/lib/errors";
import { HTTP_STATUS } from "@/lib/http";
import {
  createBlogPostSchema,
  listBlogPostsQuerySchema,
} from "@/lib/validations/blog";

// ==================== GET — List Blog Posts ====================

export const GET = createApiHandler({
  schema: null, // No body — query params parsed manually
  handler: async ({ request }) => {
    // 1. Parse and validate query params
    const url = new URL(request.url);
    const queryResult = listBlogPostsQuerySchema.safeParse({
      categoryId: url.searchParams.get("categoryId") || undefined,
      status: url.searchParams.get("status") || undefined,
      page: url.searchParams.get("page") || undefined,
      pageSize: url.searchParams.get("pageSize") || undefined,
    });

    if (!queryResult.success) {
      const firstIssue = queryResult.error.issues[0];
      const fieldPath = firstIssue.path.join(".");
      const message = fieldPath
        ? `${fieldPath}: ${firstIssue.message}`
        : firstIssue.message;

      return Response.json(
        {
          success: false,
          error: "VAL_INVALID_INPUT",
          message,
          statusCode: HTTP_STATUS.BAD_REQUEST,
        },
        { status: HTTP_STATUS.BAD_REQUEST }
      );
    }

    const { categoryId, status, page, pageSize } = queryResult.data;

    // 2. Build where clause — public sees PUBLISHED only; admin can filter by status
    const where: Record<string, unknown> = {};

    // Check if user is admin (optional auth header)
    let isAdmin = false;
    try {
      const { user } = await requireActiveUser(request);
      if (user.role === "ADMIN") {
        isAdmin = true;
      }
    } catch {
      // No valid auth — public user
    }

    if (isAdmin && status) {
      where.status = status;
    } else {
      // Public users only see PUBLISHED posts
      where.status = "PUBLISHED";
    }

    if (categoryId) {
      where.categoryId = categoryId;
    }

    // 3. Count total and fetch paginated posts with category and author info
    const [total, items] = await Promise.all([
      prisma.blogPost.count({ where }),
      prisma.blogPost.findMany({
        where,
        select: {
          id: true,
          titleHi: true,
          titleEn: true,
          slug: true,
          excerptHi: true,
          excerptEn: true,
          coverImageUrl: true,
          status: true,
          categoryId: true,
          authorId: true,
          publishedAt: true,
          createdAt: true,
          updatedAt: true,
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
        orderBy: [
          { publishedAt: "desc" },
          { createdAt: "desc" },
        ],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    // 5. Return with pagination
    return {
      items,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  },
});

// ==================== POST — Create Blog Post (Admin) ====================

export const POST = createApiHandler({
  schema: createBlogPostSchema,
  successMessage: "Blog post created successfully",
  successStatus: HTTP_STATUS.CREATED,
  handler: async ({ parsedBody, request }) => {
    const {
      titleHi,
      titleEn,
      slug,
      contentHi,
      contentEn,
      excerptHi,
      excerptEn,
      coverImageUrl,
      categoryId,
      authorId,
    } = parsedBody;

    // 1. Verify admin access
    const { user } = await requireActiveUser(request);
    if (user.role !== "ADMIN") {
      throw new AdminRequiredError();
    }

    // 2. Check slug uniqueness
    const existingSlug = await prisma.blogPost.findUnique({
      where: { slug },
    });
    if (existingSlug) {
      throw new ConflictError("A blog post with this slug already exists");
    }

    // 3. Check category exists
    const category = await prisma.blogCategory.findUnique({
      where: { id: categoryId },
    });
    if (!category) {
      throw new NotFoundError("Blog category not found");
    }

    // 4. If authorId provided, verify the author exists
    const finalAuthorId = authorId || user.id;
    if (authorId) {
      const author = await prisma.user.findUnique({
        where: { id: authorId },
      });
      if (!author) {
        throw new NotFoundError("Author not found");
      }
    }

    // 5. Create blog post
    const newPost = await prisma.blogPost.create({
      data: {
        titleHi,
        titleEn,
        slug,
        contentHi,
        contentEn: contentEn || null,
        excerptHi: excerptHi || null,
        excerptEn: excerptEn || null,
        coverImageUrl: coverImageUrl || null,
        categoryId,
        authorId: finalAuthorId,
        status: "DRAFT", // New posts always start as DRAFT
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

    return newPost;
  },
});
