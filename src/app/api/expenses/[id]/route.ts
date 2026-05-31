/**
 * Purpose: Expense detail, update, and delete API endpoints
 * Responsibility: Get expense detail (admin), update expense (admin), delete expense (admin)
 *
 * Endpoints:
 *   GET    /api/expenses/[id]   — Get expense detail (admin only)
 *   PATCH  /api/expenses/[id]   — Update expense (admin only)
 *   DELETE /api/expenses/[id]   — Delete expense (admin only, hard delete)
 *
 * PATCH Request Body:
 *   branchId (opt), category (opt), amount (opt), description (opt),
 *   date (opt, YYYY-MM-DD), receiptUrl (opt)
 *
 * Error Responses:
 *   403: { success: false, error: "PERM_ADMIN_REQUIRED" }
 *   404: { success: false, error: "RES_NOT_FOUND" }
 */

import { createApiHandler } from "@/lib/api-handler";
import { prisma } from "@/lib/prisma";
import { requireActiveUser } from "@/lib/auth-helpers";
import { NotFoundError, AdminRequiredError } from "@/lib/errors";
import { updateExpenseSchema } from "@/lib/validations/expenses";

// ==================== Helper — extract [id] from URL ====================

function extractIdFromUrl(request: Request): string | null {
  const url = new URL(request.url);
  const segments = url.pathname.split("/");
  const idIndex = segments.indexOf("expenses") + 1;
  return segments[idIndex] || null;
}

// ==================== GET — Expense Detail (Admin) ====================

export const GET = createApiHandler({
  schema: null,
  handler: async ({ request }) => {
    // 1. Verify admin access
    const { user } = await requireActiveUser(request);
    if (user.role !== "ADMIN") {
      throw new AdminRequiredError();
    }

    const id = extractIdFromUrl(request);
    if (!id) {
      throw new NotFoundError("Expense not found");
    }

    const expense = await prisma.expense.findUnique({
      where: { id },
      include: {
        branch: {
          select: {
            id: true,
            nameHi: true,
            nameEn: true,
          },
        },
      },
    });

    if (!expense) {
      throw new NotFoundError("Expense not found");
    }

    // Return with serialized decimal values
    return {
      ...expense,
      amount: expense.amount.toString(),
      date: expense.date.toISOString().split("T")[0],
    };
  },
});

// ==================== PATCH — Update Expense (Admin) ====================

export const PATCH = createApiHandler({
  schema: updateExpenseSchema,
  successMessage: "Expense updated successfully",
  handler: async ({ parsedBody, request }) => {
    const id = extractIdFromUrl(request);
    if (!id) {
      throw new NotFoundError("Expense not found");
    }

    // 1. Verify admin access
    const { user } = await requireActiveUser(request);
    if (user.role !== "ADMIN") {
      throw new AdminRequiredError();
    }

    // 2. Check expense exists
    const existingExpense = await prisma.expense.findUnique({
      where: { id },
    });
    if (!existingExpense) {
      throw new NotFoundError("Expense not found");
    }

    // 3. Check branch exists if being changed
    if (parsedBody.branchId && parsedBody.branchId !== existingExpense.branchId) {
      const branch = await prisma.branch.findUnique({
        where: { id: parsedBody.branchId },
      });
      if (!branch) {
        throw new NotFoundError("Branch not found");
      }
    }

    // 4. Build update data — only include fields that are provided
    const updateData: Record<string, unknown> = {};
    if (parsedBody.branchId !== undefined) updateData.branchId = parsedBody.branchId;
    if (parsedBody.category !== undefined) updateData.category = parsedBody.category;
    if (parsedBody.amount !== undefined) updateData.amount = parseFloat(parsedBody.amount);
    if (parsedBody.description !== undefined) updateData.description = parsedBody.description;
    if (parsedBody.date !== undefined) updateData.date = new Date(parsedBody.date);
    if (parsedBody.receiptUrl !== undefined) updateData.receiptUrl = parsedBody.receiptUrl || null;

    // 5. Update expense
    const updatedExpense = await prisma.expense.update({
      where: { id },
      data: updateData,
      include: {
        branch: {
          select: {
            id: true,
            nameHi: true,
            nameEn: true,
          },
        },
      },
    });

    // 6. Return with serialized decimals
    return {
      ...updatedExpense,
      amount: updatedExpense.amount.toString(),
      date: updatedExpense.date.toISOString().split("T")[0],
    };
  },
});

// ==================== DELETE — Delete Expense (Admin) ====================

export const DELETE = createApiHandler({
  schema: null,
  successMessage: "Expense deleted successfully",
  handler: async ({ request }) => {
    const id = extractIdFromUrl(request);
    if (!id) {
      throw new NotFoundError("Expense not found");
    }

    // 1. Verify admin access
    const { user } = await requireActiveUser(request);
    if (user.role !== "ADMIN") {
      throw new AdminRequiredError();
    }

    // 2. Check expense exists
    const existingExpense = await prisma.expense.findUnique({
      where: { id },
    });
    if (!existingExpense) {
      throw new NotFoundError("Expense not found");
    }

    // 3. Hard delete expense
    await prisma.expense.delete({
      where: { id },
    });

    return null;
  },
});
