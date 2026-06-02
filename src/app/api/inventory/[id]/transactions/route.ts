/**
 * Purpose: Inventory transactions list and create API endpoints
 * Responsibility: List transactions for an inventory item (admin) and add new transactions (admin)
 *
 * Endpoints:
 *   GET  /api/inventory/[id]/transactions  — List transactions for inventory item (admin only)
 *   POST /api/inventory/[id]/transactions  — Add a new transaction (admin only)
 *
 * GET Query Params:
 *   page      (default 1) — Page number
 *   pageSize  (default 20, max 100) — Items per page
 *
 * POST Request Body:
 *   type (PURCHASE|SALE|ADJUSTMENT|DAMAGE), quantity (int), reason (opt)
 *
 * Transaction logic:
 *   - PURCHASE: Increase stock by quantity
 *   - SALE: Decrease stock by quantity
 *   - ADJUSTMENT: Can be positive or negative
 *   - DAMAGE: Decrease stock by quantity
 *
 * Responses:
 *   200: { success: true, data: { items, pagination } }
 *   201: { success: true, data: transaction, message }
 *   403: { success: false, error: "PERM_ADMIN_REQUIRED" }
 *   404: { success: false, error: "RES_NOT_FOUND" }
 */

import { createApiHandler } from "@/lib/api-handler";
import { prisma } from "@/lib/prisma";
import { requireActiveUser } from "@/lib/auth-helpers";
import { NotFoundError, AdminRequiredError, ValidationError } from "@/lib/errors";
import { HTTP_STATUS } from "@/lib/http";
import { createTransactionSchema } from "@/lib/validations/inventory";

// ==================== Helper — extract [id] from URL ====================

function extractIdFromUrl(request: Request): string | null {
  const url = new URL(request.url);
  const segments = url.pathname.split("/");
  const idIndex = segments.indexOf("inventory") + 1;
  return segments[idIndex] || null;
}

// ==================== GET — List Transactions (Admin) ====================

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

    // 2. Check inventory item exists
    const inventoryItem = await prisma.inventoryItem.findUnique({
      where: { id },
    });
    if (!inventoryItem) {
      throw new NotFoundError("Inventory item not found");
    }

    // 3. Parse query params
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get("page") || "1", 10);
    const pageSize = Math.min(parseInt(url.searchParams.get("pageSize") || "20", 10), 100);

    // 4. Count total transactions
    const total = await prisma.inventoryTransaction.count({
      where: { inventoryItemId: id },
    });

    // 5. Fetch paginated transactions
    const items = await prisma.inventoryTransaction.findMany({
      where: { inventoryItemId: id },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    // 6. Return with pagination
    return {
      items,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  },
});

// ==================== POST — Create Transaction (Admin) ====================

export const POST = createApiHandler({
  schema: createTransactionSchema,
  successMessage: "Inventory transaction created successfully",
  successStatus: HTTP_STATUS.CREATED,
  handler: async ({ parsedBody, request }) => {
    const { type, quantity, reason } = parsedBody;

    // 1. Verify admin access
    const { user } = await requireActiveUser(request);
    if (user.role !== "ADMIN") {
      throw new AdminRequiredError();
    }

    const id = extractIdFromUrl(request);
    if (!id) {
      throw new NotFoundError("Inventory item not found");
    }

    // 2. Check inventory item exists
    const inventoryItem = await prisma.inventoryItem.findUnique({
      where: { id },
    });
    if (!inventoryItem) {
      throw new NotFoundError("Inventory item not found");
    }

    // 3. Determine quantity change based on transaction type
    let quantityChange = 0;
    switch (type) {
      case "PURCHASE":
        quantityChange = quantity;
        break;
      case "SALE":
        quantityChange = -quantity;
        break;
      case "ADJUSTMENT":
        quantityChange = quantity; // Positive adjustment
        break;
      case "DAMAGE":
        quantityChange = -quantity;
        break;
    }

    // 4. Validate that stock won't go negative
    const newQuantity = inventoryItem.quantity + quantityChange;
    if (newQuantity < 0) {
      throw new ValidationError(
        `Insufficient stock. Current: ${inventoryItem.quantity}, Change: ${quantityChange}, Result: ${newQuantity}`
      );
    }

    // 5. Create transaction and update inventory in a transaction
    const transaction = await prisma.$transaction(async (tx) => {
      // Create the transaction record
      const newTransaction = await tx.inventoryTransaction.create({
        data: {
          inventoryItemId: id,
          type,
          quantity: quantityChange,
          reason: reason || null,
          performedBy: user.id,
        },
      });

      // Update inventory item quantity
      await tx.inventoryItem.update({
        where: { id },
        data: { quantity: newQuantity },
      });

      return newTransaction;
    });

    return transaction;
  },
});
