/**
 * Purpose: Zod validation schemas for Service Categories API routes
 * Responsibility: Validate all service category API inputs using shared primitives
 * Important Notes:
 *   - Uses common schemas from validations/common.ts
 *   - One schema per API endpoint
 *   - Export both schema and inferred type
 */

import { z } from "zod";
import { nonEmptyString, slug, pageParam, pageSizeParam } from "../common";

// ==================== CREATE CATEGORY ====================

/** POST /api/service-categories */
export const createCategorySchema = z.object({
  nameHi: nonEmptyString,
  nameEn: nonEmptyString,
  slug: slug,
  icon: z.string().optional(),
  sortOrder: z.number().int().min(0).optional(),
});

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;

// ==================== UPDATE CATEGORY ====================

/** PATCH /api/service-categories/[id] — all fields optional */
export const updateCategorySchema = createCategorySchema.partial();

export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;

// ==================== LIST CATEGORIES QUERY ====================

/** GET /api/service-categories — query params */
export const listCategoriesQuerySchema = z.object({
  isActive: z
    .enum(["true", "false"])
    .optional()
    .transform((val) => val === "true" ? true : val === "false" ? false : undefined),
  page: pageParam,
  pageSize: pageSizeParam,
});

export type ListCategoriesQueryInput = z.infer<typeof listCategoriesQuerySchema>;
