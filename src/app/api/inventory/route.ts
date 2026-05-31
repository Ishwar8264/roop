/**
 * Purpose: Inventory list API endpoint
 * Responsibility: List inventory items with pagination (admin only)
 *
 * Endpoints:
 *   GET  /api/inventory        — List inventory items with pagination (admin only)
 *
 * GET Query Params:
 *   branchId  (optional) — Filter by branch
 *   lowStock  (optional) — Filter items at or below low stock threshold
 *   page      (default 1) — Page number
 *   pageSize  (default 20, max 100) — Items per page
 *
 * Responses:
 *   200: { success: true, data: { items, pagination } }
 *   403: { success: false, error: "PERM_ADMIN_REQUIRED", message }
 */

import { createApiHandler } from "@/lib/api-handler";
import { prisma } from "@/lib/prisma";
import { requireActiveUser } from "@/lib/auth-helpers";
import { AdminRequiredError } from "@/lib/errors";
import { HTTP_STATUS } from "@/lib/http";
import { listInventoryQuerySchema } from "@/lib/validations/inventory";

// ==================== GET — List Inventory (Admin) ====================

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
    const queryResult = listInventoryQuerySchema.safeParse({
      branchId: url.searchParams.get("branchId") || undefined,
      lowStock: url.searchParams.get("lowStock") || undefined,
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

    const { branchId, lowStock, page, pageSize } = queryResult.data;

    // 3. Build where clause
    const where: Record<string, unknown> = {};
    if (branchId) {
      where.branchId = branchId;
    }

    // 4. Count total matching items
    const total = await prisma.inventoryItem.count({ where });

    // 5. Fetch paginated inventory items
    const items = await prisma.inventoryItem.findMany({
      where,
      select: {
        id: true,
        productId: true,
        branchId: true,
        quantity: true,
        lowStockThreshold: true,
        createdAt: true,
        updatedAt: true,
        product: {
          select: {
            id: true,
            nameHi: true,
            nameEn: true,
            slug: true,
            price: true,
            imageUrl: true,
            isActive: true,
          },
        },
        branch: {
          select: {
            id: true,
            nameHi: true,
            nameEn: true,
          },
        },
      },
      orderBy: { updatedAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    // 6. Filter for low stock if requested
    let filteredItems = items;
    if (lowStock) {
      filteredItems = items.filter((item) => item.quantity <= item.lowStockThreshold);
    }

    // 7. Return with pagination and serialized decimals
    return {
      items: filteredItems.map((item) => ({
        ...item,
        product: {
          ...item.product,
          price: item.product.price.toString(),
        },
        isLowStock: item.quantity <= item.lowStockThreshold,
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
