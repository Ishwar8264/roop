/**
 * Purpose: Zod validation schemas for Packages API routes
 * Responsibility: Validate all package API inputs using shared primitives
 * Important Notes:
 *   - Uses common schemas from validations/common.ts
 *   - One schema per API endpoint
 *   - Export both schema and inferred type
 *   - All monetary values as decimal strings
 */

import { z } from "zod";
import { cuid, nonEmptyString, decimalString, slug, pageParam, pageSizeParam } from "../common";

// ==================== CREATE PACKAGE ====================

/** POST /api/packages */
export const createPackageSchema = z.object({
  nameHi: nonEmptyString,
  nameEn: nonEmptyString,
  slug: slug,
  descriptionHi: nonEmptyString,
  descriptionEn: nonEmptyString.optional(),
  price: decimalString,
  originalPrice: decimalString,
  durationMinutes: z.number().int().positive("Duration must be a positive integer"),
  imageUrl: z.string().url("Must be a valid URL").optional(),
  branchId: cuid,
  validFrom: z.string().datetime("Must be a valid ISO datetime").optional(),
  validUntil: z.string().datetime("Must be a valid ISO datetime").optional(),
});

export type CreatePackageInput = z.infer<typeof createPackageSchema>;

// ==================== UPDATE PACKAGE ====================

/** PATCH /api/packages/[id] — all fields optional */
export const updatePackageSchema = createPackageSchema.partial();

export type UpdatePackageInput = z.infer<typeof updatePackageSchema>;

// ==================== LINK SERVICES ====================

/** POST /api/packages/[id]/services */
export const linkServicesSchema = z.object({
  serviceIds: z.array(cuid).min(1, "At least one service ID required"),
});

export type LinkServicesInput = z.infer<typeof linkServicesSchema>;

// ==================== LIST PACKAGES QUERY ====================

/** GET /api/packages — query params */
export const listPackagesQuerySchema = z.object({
  branchId: cuid.optional(),
  page: pageParam,
  pageSize: pageSizeParam,
});

export type ListPackagesQueryInput = z.infer<typeof listPackagesQuerySchema>;
