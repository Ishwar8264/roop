/**
 * Purpose: Zod validation schemas for Blog API routes
 * Responsibility: Validate all blog category and blog post API inputs using shared primitives
 * Important Notes:
 *   - Uses common schemas from validations/common.ts
 *   - One schema per API endpoint
 *   - Export both schema and inferred type
 *   - BlogPost model uses coverImageUrl (not coverUrl)
 *   - authorId defaults to current user in route handler
 */

import { z } from "zod";
import { cuid, nonEmptyString, slug, pageParam, pageSizeParam } from "../common";

// ==================== BLOG CATEGORIES ====================

/** POST /api/blog/categories */
export const createBlogCategorySchema = z.object({
  nameHi: nonEmptyString,
  nameEn: nonEmptyString,
  slug: slug,
  sortOrder: z.number().int().min(0).default(0),
});

export type CreateBlogCategoryInput = z.infer<typeof createBlogCategorySchema>;

/** PATCH /api/blog/categories/[id] — all fields optional */
export const updateBlogCategorySchema = createBlogCategorySchema.partial();

export type UpdateBlogCategoryInput = z.infer<typeof updateBlogCategorySchema>;

// ==================== BLOG POSTS ====================

/** POST /api/blog/posts */
export const createBlogPostSchema = z.object({
  titleHi: nonEmptyString,
  titleEn: nonEmptyString,
  slug: slug,
  contentHi: nonEmptyString,
  contentEn: nonEmptyString.optional(),
  excerptHi: nonEmptyString.optional(),
  excerptEn: nonEmptyString.optional(),
  coverImageUrl: z.url("Must be a valid URL").optional(),
  categoryId: cuid,
  authorId: cuid.optional(), // Defaults to current admin user in route handler
});

export type CreateBlogPostInput = z.infer<typeof createBlogPostSchema>;

/** PATCH /api/blog/posts/[id] — partial, authorId is immutable */
export const updateBlogPostSchema = z.object({
  titleHi: nonEmptyString.optional(),
  titleEn: nonEmptyString.optional(),
  slug: slug.optional(),
  contentHi: nonEmptyString.optional(),
  contentEn: nonEmptyString.optional(),
  excerptHi: nonEmptyString.optional(),
  excerptEn: nonEmptyString.optional(),
  coverImageUrl: z.url("Must be a valid URL").optional(),
  categoryId: cuid.optional(),
});

export type UpdateBlogPostInput = z.infer<typeof updateBlogPostSchema>;

// ==================== LIST BLOG POSTS QUERY ====================

/** GET /api/blog/posts — query params */
export const listBlogPostsQuerySchema = z.object({
  categoryId: cuid.optional(),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).optional(), // Admin only — public ignores this
  page: pageParam,
  pageSize: pageSizeParam,
});

export type ListBlogPostsQueryInput = z.infer<typeof listBlogPostsQuerySchema>;
