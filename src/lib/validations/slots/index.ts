/**
 * Purpose: Zod validation schemas for Slot Availability API routes
 * Responsibility: Validate slot availability query parameters
 * Important Notes:
 *   - Uses common schemas from validations/common.ts
 *   - One schema per API endpoint
 *   - Date as YYYY-MM-DD, time as HH:MM
 */

import { z } from "zod";
import { cuid, dateString } from "../common";

// ==================== AVAILABLE SLOTS QUERY ====================

/** GET /api/slots/available — query params */
export const availableSlotsQuerySchema = z.object({
  branchId: cuid,
  serviceId: cuid,
  date: dateString,
  staffId: cuid.optional(),
  variantId: cuid.optional(),
});

export type AvailableSlotsQueryInput = z.infer<typeof availableSlotsQuerySchema>;
