/**
 * Purpose: Zod validation schemas for Services, Variants, and AddOns API routes
 * Responsibility: Validate all service/variant/addon API inputs using shared primitives
 * Important Notes:
 *   - Uses common schemas from validations/common.ts
 *   - One schema per API endpoint
 *   - Export both schema and inferred type
 *   - All monetary values as decimal strings
 */

import { z } from "zod";
import { cuid, nonEmptyString, decimalString, slug, pageParam, pageSizeParam } from "../common";

// ==================== CREATE SERVICE ====================

/** POST /api/services */
export const createServiceSchema = z.object({
  nameHi: nonEmptyString,
  nameEn: nonEmptyString,
  slug: slug,
  descriptionHi: nonEmptyString,
  descriptionEn: z.string().optional(),
  descriptionHtml: z.string().optional(),
  price: decimalString,
  durationMinutes: z.number().int().positive("Duration must be a positive integer"),
  imageUrl: z.url("Must be a valid URL").optional(),
  branchId: cuid,
  categoryId: cuid,
});

export type CreateServiceInput = z.infer<typeof createServiceSchema>;

// ==================== UPDATE SERVICE ====================

/** PATCH /api/services/[id] — all fields optional */
export const updateServiceSchema = createServiceSchema.partial();

export type UpdateServiceInput = z.infer<typeof updateServiceSchema>;

// ==================== LIST SERVICES QUERY ====================

/** GET /api/services — query params */
export const listServicesQuerySchema = z.object({
  branchId: cuid.optional(),
  categoryId: cuid.optional(),
  isActive: z
    .enum(["true", "false"])
    .optional()
    .transform((val) => val === "true" ? true : val === "false" ? false : undefined),
  page: pageParam,
  pageSize: pageSizeParam,
});

export type ListServicesQueryInput = z.infer<typeof listServicesQuerySchema>;

// ==================== CREATE VARIANT ====================

/** POST /api/services/[id]/variants */
export const createVariantSchema = z.object({
  nameHi: nonEmptyString,
  nameEn: nonEmptyString,
  price: decimalString,
  durationMinutes: z.number().int().positive("Duration must be a positive integer"),
  sortOrder: z.number().int().min(0).optional(),
});

export type CreateVariantInput = z.infer<typeof createVariantSchema>;

// ==================== UPDATE VARIANT ====================

/** PATCH /api/services/[id]/variants/[vid] — all fields optional */
export const updateVariantSchema = createVariantSchema.partial();

export type UpdateVariantInput = z.infer<typeof updateVariantSchema>;

// ==================== CREATE ADD-ON ====================

/** POST /api/services/[id]/addons */
export const createAddOnSchema = z.object({
  nameHi: nonEmptyString,
  nameEn: nonEmptyString,
  price: decimalString,
  durationMinutes: z.number().int().positive("Duration must be a positive integer"),
});

export type CreateAddOnInput = z.infer<typeof createAddOnSchema>;

// ==================== UPDATE ADD-ON ====================

/** PATCH /api/services/[id]/addons/[aid] — all fields optional */
export const updateAddOnSchema = createAddOnSchema.partial();

export type UpdateAddOnInput = z.infer<typeof updateAddOnSchema>;
