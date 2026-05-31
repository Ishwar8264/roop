/**
 * Purpose: Zod validation schemas for Customer Addresses API routes
 * Responsibility: Validate all address API inputs using shared primitives
 * Important Notes:
 *   - Uses common schemas from validations/common.ts
 *   - One schema per API endpoint
 *   - Export both schema and inferred type
 */

import { z } from "zod";
import { cuid, nonEmptyString, pageParam, pageSizeParam } from "../common";

// ==================== CREATE ADDRESS ====================

/** POST /api/addresses */
export const createAddressSchema = z.object({
  label: z.enum(["Home", "Office", "Other"], {
    message: "Label must be Home, Office, or Other",
  }),
  address: z.string().min(5, "Address must be at least 5 characters").max(500),
  city: nonEmptyString,
  pincode: z.string().regex(/^\d{6}$/, "PIN code must be exactly 6 digits"),
  landmark: z.string().max(200).optional(),
  isDefault: z.boolean().default(false),
});

export type CreateAddressInput = z.infer<typeof createAddressSchema>;

// ==================== UPDATE ADDRESS ====================

/** PATCH /api/addresses/[id] */
export const updateAddressSchema = z.object({
  label: z.enum(["Home", "Office", "Other"]).optional(),
  address: z.string().min(5).max(500).optional(),
  city: nonEmptyString.optional(),
  pincode: z.string().regex(/^\d{6}$/).optional(),
  landmark: z.string().max(200).optional(),
});

export type UpdateAddressInput = z.infer<typeof updateAddressSchema>;
