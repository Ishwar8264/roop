/**
 * Purpose: Services list and create API endpoints
 * Responsibility: List active services with pagination (public) and create new services (admin)
 *
 * Endpoints:
 *   GET  /api/services        — List active services with pagination (public)
 *   POST /api/services        — Create a new service (admin only)
 *
 * GET Query Params:
 *   branchId   (optional) — Filter by branch
 *   categoryId (optional) — Filter by service category
 *   isActive   (optional) — Filter by active status (defaults to true for public)
 *   page       (default 1) — Page number
 *   pageSize   (default 20, max 100) — Items per page
 *
 * POST Request Body:
 *   nameHi, nameEn, slug, descriptionHi, descriptionEn (optional),
 *   descriptionHtml (optional), price, durationMinutes, imageUrl (optional),
 *   branchId, categoryId
 *
 * Responses:
 *   200: { success: true, data: { items, pagination } }
 *   201: { success: true, data: service, message }
 *   400: { success: false, error, message }
 *   403: { success: false, error: "PERM_ADMIN_REQUIRED", message }
 *   409: { success: false, error: "RES_CONFLICT", message }
 */

import { createApiHandler } from "@/lib/api-handler";
import { prisma } from "@/lib/prisma";
import { requireActiveUser } from "@/lib/auth-helpers";
import { NotFoundError, ConflictError, AdminRequiredError } from "@/lib/errors";
import { HTTP_STATUS } from "@/lib/http";
import {
  createServiceSchema,
  listServicesQuerySchema,
} from "@/lib/validations/services";

// ==================== GET — List Services (Public) ====================

export const GET = createApiHandler({
  schema: null, // No body — query params parsed manually
  handler: async ({ request }) => {
    // 1. Parse and validate query params
    const url = new URL(request.url);
    const queryResult = listServicesQuerySchema.safeParse({
      branchId: url.searchParams.get("branchId") || undefined,
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

    const { branchId, categoryId, isActive, page, pageSize } = queryResult.data;

    // 2. Build where clause — public only sees active services by default
    const where: Record<string, unknown> = {};

    if (isActive !== undefined) {
      where.isActive = isActive;
    } else {
      where.isActive = true;
    }

    if (branchId) {
      where.branchId = branchId;
    }

    if (categoryId) {
      where.categoryId = categoryId;
    }

    // 3. Count total matching services
    const total = await prisma.service.count({ where });

    // 4. Fetch paginated services
    const items = await prisma.service.findMany({
      where,
      select: {
        id: true,
        nameHi: true,
        nameEn: true,
        slug: true,
        descriptionHi: true,
        descriptionEn: true,
        descriptionHtml: true,
        price: true,
        durationMinutes: true,
        imageUrl: true,
        isActive: true,
        branchId: true,
        categoryId: true,
        createdAt: true,
        updatedAt: true,
        branch: {
          select: { id: true, nameHi: true, nameEn: true },
        },
        category: {
          select: { id: true, nameHi: true, nameEn: true, slug: true },
        },
        _count: {
          select: { variants: true, addOns: true },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    // 5. Return with pagination and serialized decimals
    return {
      items: items.map((svc) => ({
        ...svc,
        price: svc.price.toString(),
        variantsCount: svc._count.variants,
        addOnsCount: svc._count.addOns,
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

// ==================== POST — Create Service (Admin) ====================

export const POST = createApiHandler({
  schema: createServiceSchema,
  successMessage: "Service created successfully",
  successStatus: HTTP_STATUS.CREATED,
  handler: async ({ parsedBody, request }) => {
    const {
      nameHi,
      nameEn,
      slug,
      descriptionHi,
      descriptionEn,
      descriptionHtml,
      price,
      durationMinutes,
      imageUrl,
      branchId,
      categoryId,
    } = parsedBody;

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

    // 3. Check category exists
    const category = await prisma.serviceCategory.findUnique({
      where: { id: categoryId },
    });
    if (!category) {
      throw new NotFoundError("Service category not found");
    }

    // 4. Check slug uniqueness
    const existingSlug = await prisma.service.findUnique({
      where: { slug },
    });
    if (existingSlug) {
      throw new ConflictError("A service with this slug already exists");
    }

    // 5. Create service
    const newService = await prisma.service.create({
      data: {
        nameHi,
        nameEn,
        slug,
        descriptionHi,
        descriptionEn: descriptionEn || null,
        descriptionHtml: descriptionHtml || null,
        price: parseFloat(price),
        durationMinutes,
        imageUrl: imageUrl || null,
        branchId,
        categoryId,
      },
      include: {
        branch: {
          select: { id: true, nameHi: true, nameEn: true },
        },
        category: {
          select: { id: true, nameHi: true, nameEn: true, slug: true },
        },
        variants: {
          where: { isActive: true },
          orderBy: { sortOrder: "asc" },
        },
        addOns: {
          where: { isActive: true },
        },
      },
    });

    // 6. Return created service with serialized decimals
    return {
      ...newService,
      price: newService.price.toString(),
      variants: newService.variants.map((v) => ({
        ...v,
        price: v.price.toString(),
      })),
      addOns: newService.addOns.map((a) => ({
        ...a,
        price: a.price.toString(),
      })),
    };
  },
});
