/**
 * Purpose: Product Categories list and create API endpoints
 * Responsibility: List product categories (public) and create new categories (admin)
 *
 * Endpoints:
 *   GET  /api/product-categories        — List product categories with pagination (public)
 *   POST /api/product-categories        — Create a new product category (admin only)
 *
 * GET Query Params:
 *   isActive  (optional) — Filter by active status
 *   page      (default 1) — Page number
 *   pageSize  (default 20, max 100) — Items per page
 *
 * POST Request Body:
 *   nameHi, nameEn, slug, icon (optional), sortOrder (optional, default 0)
 *
 * Responses:
 *   200: { success: true, data: { items, pagination } }
 *   201: { success: true, data: category, message }
 *   403: { success: false, error: "PERM_ADMIN_REQUIRED", message }
 *   409: { success: false, error: "RES_CONFLICT", message }
 */

import { createApiHandler } from "@/lib/api-handler";
import { prisma } from "@/lib/prisma";
import { requireActiveUser } from "@/lib/auth-helpers";
import { ConflictError, AdminRequiredError } from "@/lib/errors";
import { HTTP_STATUS } from "@/lib/http";
import {
  createProductCategorySchema,
  listProductCategoriesQuerySchema,
} from "@/lib/validations/product-categories";

// ==================== GET — List Product Categories (Public) ====================

export const GET = createApiHandler({
  schema: null,
  handler: async ({ request }) => {
    // 1. Parse and validate query params
    const url = new URL(request.url);
    const queryResult = listProductCategoriesQuerySchema.safeParse({
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

    const { isActive, page, pageSize } = queryResult.data;

    // 2. Build where clause — default to active only for public
    const where: Record<string, unknown> = {};
    if (isActive !== undefined) {
      where.isActive = isActive;
    } else {
      where.isActive = true;
    }

    // 3. Count total matching categories
    const total = await prisma.productCategory.count({ where });

    // 4. Fetch paginated categories
    const items = await prisma.productCategory.findMany({
      where,
      select: {
        id: true,
        nameHi: true,
        nameEn: true,
        slug: true,
        icon: true,
        sortOrder: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: { products: true },
        },
      },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    // 5. Return with pagination
    return {
      items: items.map((cat) => ({
        ...cat,
        productsCount: cat._count.products,
        _count: undefined,
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

// ==================== POST — Create Product Category (Admin) ====================

export const POST = createApiHandler({
  schema: createProductCategorySchema,
  successMessage: "Product category created successfully",
  successStatus: HTTP_STATUS.CREATED,
  handler: async ({ parsedBody, request }) => {
    const { nameHi, nameEn, slug, icon, sortOrder } = parsedBody;

    // 1. Verify admin access
    const { user } = await requireActiveUser(request);
    if (user.role !== "ADMIN") {
      throw new AdminRequiredError();
    }

    // 2. Check slug uniqueness
    const existingSlug = await prisma.productCategory.findUnique({
      where: { slug },
    });
    if (existingSlug) {
      throw new ConflictError("A product category with this slug already exists");
    }

    // 3. Create product category
    const category = await prisma.productCategory.create({
      data: {
        nameHi,
        nameEn,
        slug,
        icon: icon || null,
        sortOrder: sortOrder ?? 0,
      },
    });

    return category;
  },
});
