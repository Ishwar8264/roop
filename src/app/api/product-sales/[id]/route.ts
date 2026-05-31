/**
 * Purpose: Product Sale detail and update API endpoints
 * Responsibility: Get sale detail (admin), update sale status (admin)
 *
 * Endpoints:
 *   GET   /api/product-sales/[id]   — Get product sale detail with items (admin only)
 *   PATCH /api/product-sales/[id]   — Update product sale status (admin only)
 *
 * PATCH Request Body:
 *   status (PENDING|COMPLETED|CANCELLED), notes (opt)
 *
 * Update logic:
 *   - If status is COMPLETED, reduce inventory for each sale item
 *   - If status is CANCELLED, no inventory change (was never deducted)
 *
 * Error Responses:
 *   403: { success: false, error: "PERM_ADMIN_REQUIRED" }
 *   404: { success: false, error: "RES_NOT_FOUND" }
 */

import { createApiHandler } from "@/lib/api-handler";
import { prisma } from "@/lib/prisma";
import { requireActiveUser } from "@/lib/auth-helpers";
import { NotFoundError, AdminRequiredError, ValidationError } from "@/lib/errors";
import { updateProductSaleSchema } from "@/lib/validations/products";

// ==================== Helper — extract [id] from URL ====================

function extractIdFromUrl(request: Request): string | null {
  const url = new URL(request.url);
  const segments = url.pathname.split("/");
  const idIndex = segments.indexOf("product-sales") + 1;
  return segments[idIndex] || null;
}

// ==================== GET — Product Sale Detail (Admin) ====================

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
      throw new NotFoundError("Product sale not found");
    }

    const sale = await prisma.productSale.findUnique({
      where: { id },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            mobile: true,
          },
        },
        items: {
          include: {
            product: {
              select: {
                id: true,
                nameHi: true,
                nameEn: true,
              },
            },
          },
        },
      },
    });

    if (!sale) {
      throw new NotFoundError("Product sale not found");
    }

    // Return with serialized decimal values
    return {
      ...sale,
      totalAmount: sale.totalAmount.toString(),
      items: sale.items.map((item) => ({
        ...item,
        unitPrice: item.unitPrice.toString(),
        totalPrice: item.totalPrice.toString(),
      })),
    };
  },
});

// ==================== PATCH — Update Product Sale Status (Admin) ====================

export const PATCH = createApiHandler({
  schema: updateProductSaleSchema,
  successMessage: "Product sale updated successfully",
  handler: async ({ parsedBody, request }) => {
    const id = extractIdFromUrl(request);
    if (!id) {
      throw new NotFoundError("Product sale not found");
    }

    // 1. Verify admin access
    const { user } = await requireActiveUser(request);
    if (user.role !== "ADMIN") {
      throw new AdminRequiredError();
    }

    // 2. Check sale exists
    const existingSale = await prisma.productSale.findUnique({
      where: { id },
      include: { items: true },
    });
    if (!existingSale) {
      throw new NotFoundError("Product sale not found");
    }

    // 3. Prevent changing from COMPLETED back to other status
    if (existingSale.status === "COMPLETED" && parsedBody.status && parsedBody.status !== "COMPLETED") {
      throw new ValidationError("Cannot change status of a completed sale");
    }

    // 4. If marking as COMPLETED, update inventory (reduce stock)
    if (parsedBody.status === "COMPLETED" && existingSale.status !== "COMPLETED") {
      await prisma.$transaction(async (tx) => {
        // Update each inventory item for the products sold
        for (const saleItem of existingSale.items) {
          const inventoryItem = await tx.inventoryItem.findUnique({
            where: { productId: saleItem.productId },
          });

          if (inventoryItem) {
            // Reduce stock
            await tx.inventoryItem.update({
              where: { id: inventoryItem.id },
              data: { quantity: { decrement: saleItem.quantity } },
            });

            // Create inventory transaction record
            await tx.inventoryTransaction.create({
              data: {
                inventoryItemId: inventoryItem.id,
                type: "SALE",
                quantity: -saleItem.quantity,
                reason: `Product sale #${id}`,
                performedBy: user.id,
              },
            });
          }
        }

        // Update sale status
        await tx.productSale.update({
          where: { id },
          data: {
            status: "COMPLETED",
            ...(parsedBody.notes !== undefined && { notes: parsedBody.notes || null }),
          },
        });
      });
    } else {
      // Just update the sale record
      const updateData: Record<string, unknown> = {};
      if (parsedBody.status !== undefined) updateData.status = parsedBody.status;
      if (parsedBody.notes !== undefined) updateData.notes = parsedBody.notes || null;

      await prisma.productSale.update({
        where: { id },
        data: updateData,
      });
    }

    // 5. Fetch and return updated sale
    const updatedSale = await prisma.productSale.findUnique({
      where: { id },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            mobile: true,
          },
        },
        items: {
          include: {
            product: {
              select: {
                id: true,
                nameHi: true,
                nameEn: true,
              },
            },
          },
        },
      },
    });

    return {
      ...updatedSale!,
      totalAmount: updatedSale!.totalAmount.toString(),
      items: updatedSale!.items.map((item) => ({
        ...item,
        unitPrice: item.unitPrice.toString(),
        totalPrice: item.totalPrice.toString(),
      })),
    };
  },
});
