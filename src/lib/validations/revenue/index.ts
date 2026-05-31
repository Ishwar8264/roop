/**
 * Purpose: Zod validation schemas for Revenue Snapshots API routes
 * Responsibility: Validate all revenue API inputs using shared primitives
 * Important Notes:
 *   - Uses common schemas from validations/common.ts
 *   - One schema per API endpoint
 *   - Export both schema and inferred type
 */

import { z } from "zod";
import { cuid, dateString } from "../common";

// ==================== DAILY REVENUE QUERY ====================

/** GET /api/revenue/daily — query params */
export const dailyRevenueQuerySchema = z.object({
  branchId: cuid.optional(),
  dateFrom: dateString,
  dateTo: dateString,
});

export type DailyRevenueQueryInput = z.infer<typeof dailyRevenueQuerySchema>;

// ==================== SUMMARY QUERY ====================

/** GET /api/revenue/summary — query params */
export const summaryQuerySchema = z.object({
  branchId: cuid.optional(),
  period: z.enum(["daily", "weekly", "monthly"]),
  dateFrom: dateString,
  dateTo: dateString,
});

export type SummaryQueryInput = z.infer<typeof summaryQuerySchema>;

// ==================== GENERATE SNAPSHOT ====================

/** POST /api/revenue/generate */
export const generateSnapshotSchema = z.object({
  branchId: cuid,
  date: dateString,
  period: z.enum(["daily", "weekly", "monthly"]),
});

export type GenerateSnapshotInput = z.infer<typeof generateSnapshotSchema>;
