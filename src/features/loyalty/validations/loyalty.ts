/**
 * Purpose: Zod validation schemas for loyalty API routes
 * Responsibility: Validate all loyalty balance, transaction, redeem, and expire API inputs
 * Important Notes:
 *   - One schema per API endpoint
 *   - Export both schema and inferred type
 *   - Hindi-first error messages
 *   - Redeem: minimum 100 points
 *   - Expire: olderThanDays must be positive
 */

import { z } from "zod";

// ==================== REDEEM POINTS ====================

/** Body for POST /api/loyalty/redeem */
export const redeemPointsSchema = z.object({
  points: z
    .number()
    .int("अंक पूर्णांक होने चाहिए / Points must be an integer")
    .min(100, "न्यूनतम 100 अंक रिडीम करने चाहिए / Minimum 100 points required to redeem"),
  bookingId: z
    .string()
    .min(1, "बुकिंग ID खाली नहीं हो सकती / Booking ID cannot be empty")
    .optional(),
});

export type RedeemPointsInput = z.infer<typeof redeemPointsSchema>;

// ==================== EXPIRE POINTS ====================

/** Body for POST /api/loyalty/expire */
export const expirePointsSchema = z.object({
  olderThanDays: z
    .number()
    .int("दिन पूर्णांक होने चाहिए / Days must be an integer")
    .positive("दिन शून्य से अधिक होने चाहिए / Days must be greater than zero"),
});

export type ExpirePointsInput = z.infer<typeof expirePointsSchema>;
