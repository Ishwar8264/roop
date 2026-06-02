/**
 * Purpose: Inventory item detail and update API endpoints
 * Responsibility: Get inventory item detail (admin), update inventory stock/threshold (admin)
 *
 * Endpoints:
 *   GET   /api/inventory/[id]   — Get inventory item detail with product info (admin only)
 *   PATCH /api/inventory/[id]   — Update inventory item stock/threshold (admin only)
 *
 * PATCH Request Body:
 *   quantity (opt, int), lowStockThreshold (opt, int)
 *
 * Error Responses:
 *   403: { success: false, error: "PERM_ADMIN_REQUIRED" }
 *   404: { success: false, error: "RES_NOT_FOUND" }
 */

import { createApiHandler } from "@/lib/api-handler";
import { prisma } from "@/lib/prisma";
import { requireActiveUser } from "@/lib/auth-helpers";
import { NotFoundError, AdminRequiredError } from "@/lib/errors";
import { updateInventorySchema } from "@/lib/validations/inventory";

// ==================== Helper — extract [id] from URL ====================

function extractIdFromUrl(request: Request): string | null {
  const url = new URL(request.url);
  const segments = url.pathname.split("/");
  const idIndex = segments.indexOf("inventory") + 1;
  return segments[idIndex] || null;
}

// ==================== GET — Inventory Item Detail (Admin) ====================

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
      throw new NotFoundError("Inventory item not found");
    }

    const inventoryItem = await prisma.inventoryItem.findUnique({
      where: { id },
      include: {
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
        transactions: {
          select: {
            id: true,
            type: true,
            quantity: true,
            reason: true,
            performedBy: true,
            createdAt: true,
          },
          orderBy: { createdAt: "desc" },
          take: 10,
        },
      },
    });

    if (!inventoryItem) {
      throw new NotFoundError("Inventory item not found");
    }

    // Return with serialized decimals
    return {
      ...inventoryItem,
      product: {
        ...inventoryItem.product,
        price: inventoryItem.product.price.toString(),
      },
      isLowStock: inventoryItem.quantity <= inventoryItem.lowStockThreshold,
    };
  },
});

// ==================== PATCH — Update Inventory Item (Admin) ====================

export const PATCH = createApiHandler({
  schema: updateInventorySchema,
  successMessage: "Inventory item updated successfully",
  handler: async ({ parsedBody, request }) => {
    const id = extractIdFromUrl(request);
    if (!id) {
      throw new NotFoundError("Inventory item not found");
    }

    // 1. Verify admin access
    const { user } = await requireActiveUser(request);
    if (user.role !== "ADMIN") {
      throw new AdminRequiredError();
    }

    // 2. Check inventory item exists
    const existingItem = await prisma.inventoryItem.findUnique({
      where: { id },
    });
    if (!existingItem) {
      throw new NotFoundError("Inventory item not found");
    }

    // 3. Build update data
    const updateData: Record<string, unknown> = {};
    if (parsedBody.quantity !== undefined) updateData.quantity = parsedBody.quantity;
    if (parsedBody.lowStockThreshold !== undefined) updateData.lowStockThreshold = parsedBody.lowStockThreshold;

    // 4. Update inventory item
    const updatedItem = await prisma.inventoryItem.update({
      where: { id },
      data: updateData,
      include: {
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
    });

    // 5. Return with serialized decimals
    return {
      ...updatedItem,
      product: {
        ...updatedItem.product,
        price: updatedItem.product.price.toString(),
      },
      isLowStock: updatedItem.quantity <= updatedItem.lowStockThreshold,
    };
  },
});
