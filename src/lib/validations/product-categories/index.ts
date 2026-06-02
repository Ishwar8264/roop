/**
 * Purpose: Zod validation schemas for Product Categories API routes
 * Responsibility: Validate all product category API inputs using shared primitives
 * Important Notes:
 *   - Uses common schemas from validations/common.ts
 *   - One schema per API endpoint
 *   - Export both schema and inferred type
 */

import { z } from "zod";
import { nonEmptyString, slug, pageParam, pageSizeParam } from "../common";

// ==================== CREATE PRODUCT CATEGORY ====================

/** POST /api/product-categories */
export const createProductCategorySchema = z.object({
  nameHi: nonEmptyString,
  nameEn: nonEmptyString,
  slug: slug,
  icon: z.string().optional(),
  sortOrder: z.number().int().min(0).default(0),
});

export type CreateProductCategoryInput = z.infer<typeof createProductCategorySchema>;

// ==================== UPDATE PRODUCT CATEGORY ====================

/** PATCH /api/product-categories/[id] — all fields optional */
export const updateProductCategorySchema = createProductCategorySchema.partial();

export type UpdateProductCategoryInput = z.infer<typeof updateProductCategorySchema>;

// ==================== LIST PRODUCT CATEGORIES QUERY ====================

/** GET /api/product-categories — query params */
export const listProductCategoriesQuerySchema = z.object({
  isActive: z.enum(["true", "false"]).optional().transform((v) =>
    v === "true" ? true : v === "false" ? false : undefined
  ),
  page: pageParam,
  pageSize: pageSizeParam,
});

export type ListProductCategoriesQueryInput = z.infer<typeof listProductCategoriesQuerySchema>;
