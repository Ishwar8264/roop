/**
 * Purpose: Low stock alerts API endpoint
 * Responsibility: Get inventory items that are at or below their low stock threshold (admin only)
 *
 * Endpoints:
 *   GET  /api/inventory/low-stock  — List low stock inventory items (admin only)
 *
 * Responses:
 *   200: { success: true, data: { items, count } }
 *   403: { success: false, error: "PERM_ADMIN_REQUIRED", message }
 */

import { createApiHandler } from "@/lib/api-handler";
import { prisma } from "@/lib/prisma";
import { requireActiveUser } from "@/lib/auth-helpers";
import { AdminRequiredError } from "@/lib/errors";

// ==================== GET — Low Stock Alerts (Admin) ====================

export const GET = createApiHandler({
  schema: null,
  handler: async ({ request }) => {
    // 1. Verify admin access
    const { user } = await requireActiveUser(request);
    if (user.role !== "ADMIN") {
      throw new AdminRequiredError();
    }

    // 2. Parse optional branchId filter
    const url = new URL(request.url);
    const branchId = url.searchParams.get("branchId") || undefined;

    // 3. Build where clause
    const where: Record<string, unknown> = {};
    if (branchId) {
      where.branchId = branchId;
    }

    // 4. Fetch all inventory items (we filter in-memory for threshold comparison)
    const allItems = await prisma.inventoryItem.findMany({
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
      orderBy: { quantity: "asc" },
    });

    // 5. Filter for low stock items
    const lowStockItems = allItems.filter(
      (item) => item.quantity <= item.lowStockThreshold
    );

    // 6. Return with serialized decimals
    return {
      items: lowStockItems.map((item) => ({
        ...item,
        product: {
          ...item.product,
          price: item.product.price.toString(),
        },
        isLowStock: true,
        shortage: item.lowStockThreshold - item.quantity,
      })),
      count: lowStockItems.length,
    };
  },
});
