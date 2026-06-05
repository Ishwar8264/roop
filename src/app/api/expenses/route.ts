/**
 * Purpose: Expenses list and create API endpoints
 * Responsibility: List expenses with pagination (admin) and create new expenses (admin)
 *
 * Endpoints:
 *   GET  /api/expenses        — List expenses with pagination and filters (admin only)
 *   POST /api/expenses        — Create a new expense (admin only)
 *
 * GET Query Params:
 *   branchId  (optional) — Filter by branch
 *   category  (optional) — Filter by expense category
 *   dateFrom  (optional, YYYY-MM-DD) — Filter from date
 *   dateTo    (optional, YYYY-MM-DD) — Filter to date
 *   page      (default 1) — Page number
 *   pageSize  (default 20, max 100) — Items per page
 *
 * POST Request Body:
 *   branchId, category, amount, description, date (YYYY-MM-DD), receiptUrl (opt)
 *
 * Responses:
 *   200: { success: true, data: { items, pagination } }
 *   201: { success: true, data: expense, message }
 *   403: { success: false, error: "PERM_ADMIN_REQUIRED", message }
 *   404: { success: false, error: "RES_NOT_FOUND" }
 */

import { createApiHandler } from "@/lib/api-handler";
import { prisma } from "@/lib/prisma";
import { requireActiveUser } from "@/lib/auth-helpers";
import { NotFoundError, AdminRequiredError } from "@/lib/errors";
import { HTTP_STATUS } from "@/lib/http";
import {
  createExpenseSchema,
  listExpensesQuerySchema,
} from "@/lib/validations/expenses";

// ==================== GET — List Expenses (Admin) ====================

export const GET = createApiHandler({
  schema: null,
  handler: async ({ request }) => {
    // 1. Verify admin access
    const { user } = await requireActiveUser(request);
    if (user.role !== "ADMIN") {
      throw new AdminRequiredError();
    }

    // 2. Parse and validate query params
    const url = new URL(request.url);
    const queryResult = listExpensesQuerySchema.safeParse({
      branchId: url.searchParams.get("branchId") || undefined,
      category: url.searchParams.get("category") || undefined,
      dateFrom: url.searchParams.get("dateFrom") || undefined,
      dateTo: url.searchParams.get("dateTo") || undefined,
      page: url.searchParams.get("page") || undefined,
      pageSize: url.searchParams.get("pageSize") || undefined,
    });

    if (!queryResult.success) {
      const firstIssue = queryResult.error.issues[0];
      const fieldPath = firstIssue.path.join(".");
      const message = fieldPath
        ? `${fieldPath}: ${firstIssue.message}`
        : firstIssue.message;

      return Response.json(
        {
          success: false,
          error: "VAL_INVALID_INPUT",
          message,
          statusCode: HTTP_STATUS.BAD_REQUEST,
        },
        { status: HTTP_STATUS.BAD_REQUEST }
      );
    }

    const { branchId, category, dateFrom, dateTo, page, pageSize } = queryResult.data;

    // 3. Build where clause
    const where: Record<string, unknown> = {};
    if (branchId) where.branchId = branchId;
    if (category) where.category = category;
    if (dateFrom || dateTo) {
      where.date = {
        ...(dateFrom && { gte: new Date(dateFrom) }),
        ...(dateTo && { lte: new Date(dateTo) }),
      };
    }

    // 4. Count total and fetch paginated expenses
    const [total, items] = await Promise.all([
      prisma.expense.count({ where }),
      prisma.expense.findMany({
        where,
        select: {
          id: true,
          branchId: true,
          category: true,
          amount: true,
          description: true,
          date: true,
          receiptUrl: true,
          recordedBy: true,
          createdAt: true,
          updatedAt: true,
          branch: {
            select: {
              id: true,
              nameHi: true,
              nameEn: true,
            },
          },
        },
        orderBy: { date: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    // 6. Return with pagination and serialized decimals
    return {
      items: items.map((item) => ({
        ...item,
        amount: item.amount.toString(),
        date: item.date.toISOString().split("T")[0],
      })),
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  },
});

// ==================== POST — Create Expense (Admin) ====================

export const POST = createApiHandler({
  schema: createExpenseSchema,
  successMessage: "Expense created successfully",
  successStatus: HTTP_STATUS.CREATED,
  handler: async ({ parsedBody, request }) => {
    const { branchId, category, amount, description, date, receiptUrl } = parsedBody;

    // 1. Verify admin access
    const { user } = await requireActiveUser(request);
    if (user.role !== "ADMIN") {
      throw new AdminRequiredError();
    }

    // 2. Check branch exists
    const branch = await prisma.branch.findUnique({
      where: { id: branchId },
    });
    if (!branch) {
      throw new NotFoundError("Branch not found");
    }

    // 3. Create expense
    const expense = await prisma.expense.create({
      data: {
        branchId,
        category,
        amount: parseFloat(amount),
        description,
        date: new Date(date),
        receiptUrl: receiptUrl || null,
        recordedBy: user.id,
      },
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

    // 4. Return with serialized decimals
    return {
      ...expense,
      amount: expense.amount.toString(),
      date: expense.date.toISOString().split("T")[0],
    };
  },
});
