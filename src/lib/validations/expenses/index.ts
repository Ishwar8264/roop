/**
 * Purpose: Zod validation schemas for Expenses API routes
 * Responsibility: Validate all expense API inputs using shared primitives
 * Important Notes:
 *   - Uses common schemas from validations/common.ts
 *   - One schema per API endpoint
 *   - Export both schema and inferred type
 *   - All monetary values as decimal strings
 */

import { z } from "zod";
import { cuid, nonEmptyString, decimalString, dateString, pageParam, pageSizeParam } from "../common";

// ==================== CREATE EXPENSE ====================

/** POST /api/expenses */
export const createExpenseSchema = z.object({
  branchId: cuid,
  category: z.enum(["RENT", "SALARY", "SUPPLIES", "UTILITIES", "MARKETING", "MAINTENANCE", "OTHER"]),
  amount: decimalString,
  description: nonEmptyString,
  date: dateString,
  receiptUrl: z.string().url("Must be a valid URL").optional(),
});

export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;

// ==================== UPDATE EXPENSE ====================

/** PATCH /api/expenses/[id] — all fields optional */
export const updateExpenseSchema = createExpenseSchema.partial();

export type UpdateExpenseInput = z.infer<typeof updateExpenseSchema>;

// ==================== LIST EXPENSES QUERY ====================

/** GET /api/expenses — query params */
export const listExpensesQuerySchema = z.object({
  branchId: cuid.optional(),
  category: z.enum(["RENT", "SALARY", "SUPPLIES", "UTILITIES", "MARKETING", "MAINTENANCE", "OTHER"]).optional(),
  dateFrom: dateString.optional(),
  dateTo: dateString.optional(),
  page: pageParam,
  pageSize: pageSizeParam,
});

export type ListExpensesQueryInput = z.infer<typeof listExpensesQuerySchema>;
