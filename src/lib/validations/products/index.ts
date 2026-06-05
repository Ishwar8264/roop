/**
 * Purpose: Zod validation schemas for Products & Product Sales API routes
 * Responsibility: Validate all product and product sale API inputs using shared primitives
 * Important Notes:
 *   - Uses common schemas from validations/common.ts
 *   - One schema per API endpoint
 *   - Export both schema and inferred type
 *   - All monetary values as decimal strings
 */

import { z } from "zod";
import { cuid, nonEmptyString, decimalString, slug, pageParam, pageSizeParam } from "../common";

// ==================== CREATE PRODUCT ====================

/** POST /api/products */
export const createProductSchema = z.object({
  nameHi: nonEmptyString,
  nameEn: nonEmptyString,
  slug: slug,
  descriptionHi: z.string().optional(),
  descriptionEn: z.string().optional(),
  price: decimalString,
  costPrice: decimalString.optional(),
  imageUrl: z.url("Must be a valid URL").optional(),
  categoryId: cuid,
});

export type CreateProductInput = z.infer<typeof createProductSchema>;

// ==================== UPDATE PRODUCT ====================

/** PATCH /api/products/[id] — all fields optional */
export const updateProductSchema = createProductSchema.partial();

export type UpdateProductInput = z.infer<typeof updateProductSchema>;

// ==================== LIST PRODUCTS QUERY ====================

/** GET /api/products — query params */
export const listProductsQuerySchema = z.object({
  categoryId: cuid.optional(),
  isActive: z.enum(["true", "false"]).optional().transform((v) =>
    v === "true" ? true : v === "false" ? false : undefined
  ),
  page: pageParam,
  pageSize: pageSizeParam,
});

export type ListProductsQueryInput = z.infer<typeof listProductsQuerySchema>;

// ==================== CREATE PRODUCT SALE ====================

/** POST /api/product-sales */
export const createProductSaleSchema = z.object({
  customerId: cuid,
  branchId: cuid,
  items: z.array(
    z.object({
      productId: cuid,
      quantity: z.number().int().positive("Quantity must be a positive integer"),
    })
  ).min(1, "At least one item is required"),
  paymentMethod: z.enum(["RAZORPAY", "CASH", "UPI"]).optional(),
  notes: z.string().optional(),
});

export type CreateProductSaleInput = z.infer<typeof createProductSaleSchema>;

// ==================== UPDATE PRODUCT SALE ====================

/** PATCH /api/product-sales/[id] */
export const updateProductSaleSchema = z.object({
  status: z.enum(["PENDING", "COMPLETED", "CANCELLED"]).optional(),
  notes: z.string().optional(),
});

export type UpdateProductSaleInput = z.infer<typeof updateProductSaleSchema>;
