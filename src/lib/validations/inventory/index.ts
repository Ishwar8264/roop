/**
 * Purpose: Zod validation schemas for Inventory API routes
 * Responsibility: Validate all inventory API inputs using shared primitives
 * Important Notes:
 *   - Uses common schemas from validations/common.ts
 *   - One schema per API endpoint
 *   - Export both schema and inferred type
 */

import { z } from "zod";
import { cuid, pageParam, pageSizeParam } from "../common";

// ==================== LIST INVENTORY QUERY ====================

/** GET /api/inventory — query params */
export const listInventoryQuerySchema = z.object({
  branchId: cuid.optional(),
  lowStock: z.enum(["true", "false"]).optional().transform((v) =>
    v === "true" ? true : v === "false" ? false : undefined
  ),
  page: pageParam,
  pageSize: pageSizeParam,
});

export type ListInventoryQueryInput = z.infer<typeof listInventoryQuerySchema>;

// ==================== UPDATE INVENTORY ====================

/** PATCH /api/inventory/[id] */
export const updateInventorySchema = z.object({
  quantity: z.number().int().min(0, "Quantity cannot be negative").optional(),
  lowStockThreshold: z.number().int().min(0, "Threshold cannot be negative").optional(),
});

export type UpdateInventoryInput = z.infer<typeof updateInventorySchema>;

// ==================== CREATE TRANSACTION ====================

/** POST /api/inventory/[id]/transactions */
export const createTransactionSchema = z.object({
  type: z.enum(["PURCHASE", "SALE", "ADJUSTMENT", "DAMAGE"]),
  quantity: z.number().int().min(1, "Quantity must be a positive integer"),
  reason: z.string().optional(),
});

export type CreateTransactionInput = z.infer<typeof createTransactionSchema>;
