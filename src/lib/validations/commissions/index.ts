/**
 * Purpose: Zod validation schemas for Staff Commissions API routes
 * Responsibility: Validate all commission API inputs using shared primitives
 * Important Notes:
 *   - Uses common schemas from validations/common.ts
 *   - One schema per API endpoint
 *   - Export both schema and inferred type
 */

import { z } from "zod";
import { cuid, pageParam, pageSizeParam } from "../common";

// ==================== LIST COMMISSIONS QUERY ====================

/** GET /api/commissions — query params */
export const listCommissionsQuerySchema = z.object({
  staffId: cuid.optional(),
  status: z.enum(["PENDING", "PAID"]).optional(),
  page: pageParam,
  pageSize: pageSizeParam,
});

export type ListCommissionsQueryInput = z.infer<typeof listCommissionsQuerySchema>;

// ==================== PAY COMMISSION ====================

/** PATCH /api/commissions/[id]/pay — empty body, just mark as paid */
export const payCommissionSchema = z.strictObject({});

export type PayCommissionInput = z.infer<typeof payCommissionSchema>;
