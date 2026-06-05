/**
 * Purpose: Products list and create API endpoints
 * Responsibility: List products (public, paginated) and create new products (admin)
 *
 * Endpoints:
 *   GET  /api/products        — List products with pagination (public)
 *   POST /api/products        — Create a new product (admin only)
 *
 * GET Query Params:
 *   categoryId (optional) — Filter by category
 *   isActive   (optional) — Filter by active status
 *   page       (default 1) — Page number
 *   pageSize   (default 20, max 100) — Items per page
 *
 * POST Request Body:
 *   nameHi, nameEn, slug, descriptionHi (opt), descriptionEn (opt),
 *   price, costPrice (opt), imageUrl (opt), categoryId
 *
 * Responses:
 *   200: { success: true, data: { items, pagination } }
 *   201: { success: true, data: product, message }
 *   403: { success: false, error: "PERM_ADMIN_REQUIRED", message }
 *   409: { success: false, error: "RES_CONFLICT", message }
 */

import { createApiHandler } from "@/lib/api-handler";
import { prisma } from "@/lib/prisma";
import { requireActiveUser } from "@/lib/auth-helpers";
import { NotFoundError, ConflictError, AdminRequiredError } from "@/lib/errors";
import { HTTP_STATUS } from "@/lib/http";
import {
  createProductSchema,
  listProductsQuerySchema,
} from "@/lib/validations/products";

// ==================== GET — List Products (Public) ====================

export const GET = createApiHandler({
  schema: null,
  handler: async ({ request }) => {
    // 1. Parse and validate query params
    const url = new URL(request.url);
    const queryResult = listProductsQuerySchema.safeParse({
      categoryId: url.searchParams.get("categoryId") || undefined,
      isActive: url.searchParams.get("isActive") || undefined,
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

    const { categoryId, isActive, page, pageSize } = queryResult.data;

    // 2. Build where clause — public sees only active products by default
    const where: Record<string, unknown> = {};
    if (isActive !== undefined) {
      where.isActive = isActive;
    } else {
      where.isActive = true;
    }
    if (categoryId) {
      where.categoryId = categoryId;
    }

    // 3. Count total and fetch paginated products with category info
    const [total, items] = await Promise.all([
      prisma.product.count({ where }),
      prisma.product.findMany({
        where,
        select: {
          id: true,
          nameHi: true,
          nameEn: true,
          slug: true,
          descriptionHi: true,
          descriptionEn: true,
          price: true,
          costPrice: true,
          imageUrl: true,
          categoryId: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
          category: {
            select: {
              id: true,
              nameHi: true,
              nameEn: true,
              slug: true,
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
      items: items.map((item) => ({
        ...item,
        price: item.price.toString(),
        costPrice: item.costPrice?.toString() ?? null,
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

// ==================== POST — Create Product (Admin) ====================

export const POST = createApiHandler({
  schema: createProductSchema,
  successMessage: "Product created successfully",
  successStatus: HTTP_STATUS.CREATED,
  handler: async ({ parsedBody, request }) => {
    const {
      nameHi,
      nameEn,
      slug,
      descriptionHi,
      descriptionEn,
      price,
      costPrice,
      imageUrl,
      categoryId,
    } = parsedBody;

    // 1. Verify admin access
    const { user } = await requireActiveUser(request);
    if (user.role !== "ADMIN") {
      throw new AdminRequiredError();
    }

    // 2. Check category exists
    const category = await prisma.productCategory.findUnique({
      where: { id: categoryId },
    });
    if (!category) {
      throw new NotFoundError("Product category not found");
    }

    // 3. Check slug uniqueness
    const existingSlug = await prisma.product.findUnique({
      where: { slug },
    });
    if (existingSlug) {
      throw new ConflictError("A product with this slug already exists");
    }

    // 4. Create product
    const product = await prisma.product.create({
      data: {
        nameHi,
        nameEn,
        slug,
        descriptionHi: descriptionHi || null,
        descriptionEn: descriptionEn || null,
        price: parseFloat(price),
        costPrice: costPrice ? parseFloat(costPrice) : null,
        imageUrl: imageUrl || null,
        categoryId,
      },
      include: {
        category: {
          select: {
            id: true,
            nameHi: true,
            nameEn: true,
            slug: true,
          },
        },
      },
    });

    // 5. Return with serialized decimals
    return {
      ...product,
      price: product.price.toString(),
      costPrice: product.costPrice?.toString() ?? null,
    };
  },
});
