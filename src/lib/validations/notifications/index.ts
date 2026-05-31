/**
 * Purpose: Zod validation schemas for Notifications API routes
 * Responsibility: Validate all notification API inputs using shared primitives
 * Important Notes:
 *   - Uses common schemas from validations/common.ts
 *   - One schema per API endpoint
 *   - Export both schema and inferred type
 */

import { z } from "zod";
import { cuid, nonEmptyString, pageParam, pageSizeParam } from "../common";

// ==================== LIST NOTIFICATIONS ====================

/** GET /api/notifications */
export const listNotificationsQuerySchema = z.object({
  status: z.enum(["PENDING", "SENT", "FAILED"]).optional(),
  channel: z.enum(["WHATSAPP", "SMS", "EMAIL", "PUSH"]).optional(),
  page: pageParam,
  pageSize: pageSizeParam,
});

export type ListNotificationsQueryInput = z.infer<typeof listNotificationsQuerySchema>;

// ==================== SEND NOTIFICATION ====================

/** POST /api/notifications */
export const sendNotificationSchema = z.object({
  userId: cuid,
  channel: z.enum(["WHATSAPP", "SMS", "EMAIL", "PUSH"]),
  title: z.string().min(1, "Title is required").max(200, "Title too long"),
  message: z.string().min(1, "Message is required").max(5000, "Message too long"),
  trigger: z.enum([
    "BOOKING_CONFIRMED",
    "BOOKING_REMINDER",
    "BOOKING_CANCELLED",
    "PAYMENT_RECEIVED",
    "OFFER_APPLIED",
    "LOYALTY_EARNED",
    "LOYALTY_REDEEMED",
  ]).optional(),
});

export type SendNotificationInput = z.infer<typeof sendNotificationSchema>;
