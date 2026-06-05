/**
 * Purpose: Product Sales list and create API endpoints
 * Responsibility: List product sales (admin) and create new product sales (admin)
 *
 * Endpoints:
 *   GET  /api/product-sales        — List product sales with pagination (admin only)
 *   POST /api/product-sales        — Create a product sale (admin only)
 *
 * GET Query Params:
 *   page      (default 1) — Page number
 *   pageSize  (default 20, max 100) — Items per page
 *
 * POST Request Body:
 *   customerId, branchId, items (array of { productId, quantity }),
 *   paymentMethod (opt), notes (opt)
 *
 * Product Sale Creation Logic:
 *   - Look up each product's current price
 *   - Calculate unitPrice and totalPrice per item
 *   - Calculate totalAmount = sum of all item totalPrices
 *   - Create ProductSale + ProductSaleItems in a transaction
 *   - If status is COMPLETED, update inventory (reduce stock)
 *
 * Responses:
 *   200: { success: true, data: { items, pagination } }
 *   201: { success: true, data: sale, message }
 *   403: { success: false, error: "PERM_ADMIN_REQUIRED", message }
 *   404: { success: false, error: "RES_NOT_FOUND" }
 */

import { createApiHandler } from "@/lib/api-handler";
import { prisma } from "@/lib/prisma";
import { requireActiveUser } from "@/lib/auth-helpers";
import { NotFoundError, AdminRequiredError, ValidationError } from "@/lib/errors";
import { HTTP_STATUS } from "@/lib/http";
import {
  createProductSaleSchema,
} from "@/lib/validations/products";

// ==================== GET — List Product Sales (Admin) ====================

export const GET = createApiHandler({
  schema: null,
  handler: async ({ request }) => {
    // 1. Verify admin access
    const { user } = await requireActiveUser(request);
    if (user.role !== "ADMIN") {
      throw new AdminRequiredError();
    }

    // 2. Parse query params
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get("page") || "1", 10);
    const pageSize = Math.min(parseInt(url.searchParams.get("pageSize") || "20", 10), 100);

    // 3. Count total and fetch paginated sales
    const [total, items] = await Promise.all([
      prisma.productSale.count(),
      prisma.productSale.findMany({
        select: {
          id: true,
          customerId: true,
          branchId: true,
          totalAmount: true,
          status: true,
          paymentMethod: true,
          notes: true,
          createdAt: true,
          updatedAt: true,
          customer: {
            select: {
              id: true,
              name: true,
              mobile: true,
            },
          },
          items: {
            select: {
              id: true,
              productId: true,
              quantity: true,
              unitPrice: true,
              totalPrice: true,
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
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    // 5. Return with pagination and serialized decimals
    return {
      items: items.map((sale) => ({
        ...sale,
        totalAmount: sale.totalAmount.toString(),
        items: sale.items.map((item) => ({
          ...item,
          unitPrice: item.unitPrice.toString(),
          totalPrice: item.totalPrice.toString(),
        })),
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

// ==================== POST — Create Product Sale (Admin) ====================

export const POST = createApiHandler({
  schema: createProductSaleSchema,
  successMessage: "Product sale created successfully",
  successStatus: HTTP_STATUS.CREATED,
  handler: async ({ parsedBody, request }) => {
    const { customerId, branchId, items, paymentMethod, notes } = parsedBody;

    // 1. Verify admin access
    const { user } = await requireActiveUser(request);
    if (user.role !== "ADMIN") {
      throw new AdminRequiredError();
    }

    // 2. Verify customer exists
    const customer = await prisma.user.findUnique({
      where: { id: customerId },
    });
    if (!customer) {
      throw new NotFoundError("Customer not found");
    }

    // 3. Verify branch exists
    const branch = await prisma.branch.findUnique({
      where: { id: branchId },
    });
    if (!branch) {
      throw new NotFoundError("Branch not found");
    }

    // 4. Look up each product's current price and validate
    const productIds = items.map((item) => item.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds }, isActive: true },
    });

    // Validate all products exist and are active
    for (const item of items) {
      const product = products.find((p) => p.id === item.productId);
      if (!product) {
        throw new NotFoundError(`Product with ID ${item.productId} not found or inactive`);
      }
    }

    // 5. Calculate unitPrice and totalPrice per item
    const saleItems = items.map((item) => {
      const product = products.find((p) => p.id === item.productId)!;
      const unitPrice = product.price;
      const totalPrice = Number(unitPrice) * item.quantity;
      return {
        productId: item.productId,
        quantity: item.quantity,
        unitPrice,
        totalPrice,
      };
    });

    // 6. Calculate totalAmount
    const totalAmount = saleItems.reduce(
      (sum, item) => sum + Number(item.totalPrice),
      0
    );

    // 7. Create ProductSale + ProductSaleItems in a transaction
    const sale = await prisma.$transaction(async (tx) => {
      const newSale = await tx.productSale.create({
        data: {
          customerId,
          branchId,
          totalAmount,
          status: "PENDING",
          paymentMethod: paymentMethod || null,
          notes: notes || null,
          items: {
            create: saleItems.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              totalPrice: item.totalPrice,
            })),
          },
        },
        include: {
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
          customer: {
            select: {
              id: true,
              name: true,
              mobile: true,
            },
          },
        },
      });

      return newSale;
    });

    // 8. Return with serialized decimals
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
