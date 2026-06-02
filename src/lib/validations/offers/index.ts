/**
 * Purpose: Zod validation schemas for Offers & Promos API routes
 * Responsibility: Validate all offer API inputs using shared primitives
 * Important Notes:
 *   - Uses common schemas from validations/common.ts
 *   - One schema per API endpoint
 *   - Export both schema and inferred type
 *   - All monetary values as decimal strings
 *   - discountType is PERCENTAGE or FLAT_AMOUNT enum
 */

import { z } from "zod";
import { cuid, nonEmptyString, decimalString, pageParam, pageSizeParam } from "../common";

// ==================== DISCOUNT TYPE ENUM ====================

/** Discount type enum matching Prisma DiscountType */
export const discountTypeEnum = z.enum(["PERCENTAGE", "FLAT_AMOUNT"]);

// ==================== CREATE OFFER ====================

/** POST /api/offers */
export const createOfferSchema = z.object({
  code: z
    .string()
    .min(1, "Promo code is required")
    .max(50, "Promo code must be 50 characters or less")
    .regex(/^[A-Z0-9_-]+$/, "Promo code must be uppercase alphanumeric with hyphens/underscores"),
  titleHi: nonEmptyString,
  titleEn: z.string().optional(),
  descriptionHi: z.string().optional(),
  descriptionEn: z.string().optional(),
  discountType: discountTypeEnum,
  discountValue: decimalString,
  minOrder: decimalString.optional(),
  maxDiscount: decimalString.optional(),
  validFrom: z.string().datetime("Must be a valid ISO datetime"),
  validUntil: z.string().datetime("Must be a valid ISO datetime"),
  usageLimit: z.number().int().positive("Usage limit must be a positive integer").optional(),
});

export type CreateOfferInput = z.infer<typeof createOfferSchema>;

// ==================== UPDATE OFFER ====================

/** PATCH /api/offers/[id] — all fields optional */
export const updateOfferSchema = createOfferSchema.partial();

export type UpdateOfferInput = z.infer<typeof updateOfferSchema>;

// ==================== LIST OFFERS QUERY ====================

/** GET /api/offers — query params */
export const listOffersQuerySchema = z.object({
  isActive: z
    .enum(["true", "false"])
    .optional()
    .transform((v) => (v === "true" ? true : v === "false" ? false : undefined)),
  page: pageParam,
  pageSize: pageSizeParam,
});

export type ListOffersQueryInput = z.infer<typeof listOffersQuerySchema>;

// ==================== VALIDATE OFFER ====================

/** POST /api/offers/validate */
export const validateOfferSchema = z.object({
  code: z.string().min(1, "Promo code is required"),
  orderAmount: decimalString.optional(),
});

export type ValidateOfferInput = z.infer<typeof validateOfferSchema>;

// ==================== LINK SERVICES ====================

/** POST /api/offers/[id]/services */
export const linkOfferServicesSchema = z.object({
  serviceIds: z.array(cuid).min(1, "At least one service ID required"),
});

export type LinkOfferServicesInput = z.infer<typeof linkOfferServicesSchema>;
