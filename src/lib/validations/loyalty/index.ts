/**
 * Purpose: Zod validation schemas for Loyalty Points API routes
 * Responsibility: Validate all loyalty API inputs using shared primitives
 * Important Notes:
 *   - Uses common schemas from validations/common.ts
 *   - One schema per API endpoint
 *   - Export both schema and inferred type
 *   - Points must be positive integers
 *   - LoyaltyTransactionType: EARN, REDEEM, EXPIRE
 */

import { z } from "zod";
import { cuid, positiveInt, pageParam, pageSizeParam } from "../common";

// ==================== LOYALTY TYPE ENUM ====================

/** Loyalty transaction type enum matching Prisma LoyaltyTransactionType */
const loyaltyTypeEnum = z.enum(["EARN", "REDEEM", "EXPIRE"]);

// ==================== REDEEM POINTS ====================

/** POST /api/loyalty/redeem */
export const redeemPointsSchema = z.object({
  points: positiveInt,
  bookingId: cuid.optional(),
  reason: z.string().min(1, "Reason is required"),
});

export type RedeemPointsInput = z.infer<typeof redeemPointsSchema>;

// ==================== EXPIRE POINTS ====================

/** POST /api/loyalty/expire — admin only */
export const expirePointsSchema = z.object({
  olderThanMonths: positiveInt.default(12),
});

export type ExpirePointsInput = z.infer<typeof expirePointsSchema>;

// ==================== LIST HISTORY QUERY ====================

/** GET /api/loyalty/history — query params */
export const listHistoryQuerySchema = z.object({
  type: loyaltyTypeEnum.optional(),
  page: pageParam,
  pageSize: pageSizeParam,
});

export type ListHistoryQueryInput = z.infer<typeof listHistoryQuerySchema>;
