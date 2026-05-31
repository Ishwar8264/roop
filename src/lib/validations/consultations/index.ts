/**
 * Purpose: Zod validation schemas for Consultations API routes
 * Responsibility: Validate all consultation API inputs using shared primitives
 * Important Notes:
 *   - Uses common schemas from validations/common.ts
 *   - One schema per API endpoint
 *   - Export both schema and inferred type
 *   - Date in YYYY-MM-DD, Time in HH:MM format
 */

import { z } from "zod";
import { cuid, dateString, timeString, pageParam, pageSizeParam } from "../common";

// ==================== CREATE CONSULTATION ====================

/** POST /api/consultations */
export const createConsultationSchema = z.object({
  branchId: cuid,
  date: dateString, // YYYY-MM-DD
  time: timeString, // HH:MM
  staffId: cuid.optional(),
});

export type CreateConsultationInput = z.infer<typeof createConsultationSchema>;

// ==================== LIST CONSULTATIONS QUERY ====================

/** GET /api/consultations — query params */
export const listConsultationsQuerySchema = z.object({
  branchId: cuid.optional(),
  staffId: cuid.optional(),
  status: z.enum(["PENDING", "COMPLETED", "CANCELLED"]).optional(),
  date: dateString.optional(),
  page: pageParam,
  pageSize: pageSizeParam,
});

export type ListConsultationsQueryInput = z.infer<typeof listConsultationsQuerySchema>;

// ==================== COMPLETE CONSULTATION ====================

/** PATCH /api/consultations/[id]/complete */
export const completeConsultationSchema = z.object({
  notes: z.string().max(5000, "Notes too long").optional(),
});

export type CompleteConsultationInput = z.infer<typeof completeConsultationSchema>;
