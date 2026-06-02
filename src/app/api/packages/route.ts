/**
 * Purpose: Packages list and create API endpoints
 * Responsibility: List active packages (public) and create new packages (admin)
 *
 * Endpoints:
 *   GET  /api/packages        — List active packages with pagination (public)
 *   POST /api/packages        — Create a new package (admin only)
 *
 * GET Query Params:
 *   branchId  (optional) — Filter by branch
 *   page      (default 1) — Page number
 *   pageSize  (default 20, max 100) — Items per page
 *
 * POST Request Body:
 *   nameHi, nameEn, slug, descriptionHi, descriptionEn (optional),
 *   price, originalPrice, durationMinutes, imageUrl (optional),
 *   branchId, validFrom (optional), validUntil (optional)
 *
 * Responses:
 *   200: { success: true, data: { packages, pagination } }
 *   201: { success: true, data: package, message }
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
  createPackageSchema,
  listPackagesQuerySchema,
} from "@/lib/validations/packages";

// ==================== GET — List Packages (Public) ====================

export const GET = createApiHandler({
  schema: null, // No body — query params parsed manually
  handler: async ({ request }) => {
    // 1. Parse and validate query params
    const url = new URL(request.url);
    const queryResult = listPackagesQuerySchema.safeParse({
      branchId: url.searchParams.get("branchId") || undefined,
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

    const { branchId, page, pageSize } = queryResult.data;

    // 2. Build where clause — public only sees active packages
    const where: Record<string, unknown> = {
      isActive: true,
    };

    if (branchId) {
      where.branchId = branchId;
    }

    // 3. Count total matching packages
    const total = await prisma.package.count({ where });

    // 4. Fetch paginated packages with service count
    const packages = await prisma.package.findMany({
      where,
      select: {
        id: true,
        nameHi: true,
        nameEn: true,
        slug: true,
        descriptionHi: true,
        descriptionEn: true,
        price: true,
        originalPrice: true,
        durationMinutes: true,
        imageUrl: true,
        isActive: true,
        branchId: true,
        validFrom: true,
        validUntil: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: { packageServices: true },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    // 5. Return with pagination
    return {
      packages: packages.map((pkg) => ({
        ...pkg,
        price: pkg.price.toString(),
        originalPrice: pkg.originalPrice.toString(),
        servicesCount: pkg._count.packageServices,
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

// ==================== POST — Create Package (Admin) ====================

export const POST = createApiHandler({
  schema: createPackageSchema,
  successMessage: "Package created successfully",
  successStatus: HTTP_STATUS.CREATED,
  handler: async ({ parsedBody, request }) => {
    const {
      nameHi,
      nameEn,
      slug,
      descriptionHi,
      descriptionEn,
      price,
      originalPrice,
      durationMinutes,
      imageUrl,
      branchId,
      validFrom,
      validUntil,
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

    // 3. Check slug uniqueness
    const existingSlug = await prisma.package.findUnique({
      where: { slug },
    });
    if (existingSlug) {
      throw new ConflictError("A package with this slug already exists");
    }

    // 4. Create package
    const newPackage = await prisma.package.create({
      data: {
        nameHi,
        nameEn,
        slug,
        descriptionHi,
        descriptionEn: descriptionEn || null,
        price: parseFloat(price),
        originalPrice: parseFloat(originalPrice),
        durationMinutes,
        imageUrl: imageUrl || null,
        branchId,
        validFrom: validFrom ? new Date(validFrom) : null,
        validUntil: validUntil ? new Date(validUntil) : null,
      },
      include: {
        packageServices: {
          include: {
            service: {
              select: {
                id: true,
                nameHi: true,
                nameEn: true,
                price: true,
                durationMinutes: true,
              },
            },
          },
          orderBy: { sortOrder: "asc" },
        },
      },
    });

    // 5. Return created package with serialized decimals
    return {
      ...newPackage,
      price: newPackage.price.toString(),
      originalPrice: newPackage.originalPrice.toString(),
      packageServices: newPackage.packageServices.map((ps) => ({
        ...ps,
        service: {
          ...ps.service,
          price: ps.service.price.toString(),
        },
      })),
    };
  },
});
