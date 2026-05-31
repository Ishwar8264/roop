/**
 * Purpose: Package detail, update, and soft-delete API endpoints
 * Responsibility: Get package detail (public), update package (admin), soft-delete package (admin)
 *
 * Endpoints:
 *   GET    /api/packages/[id]   — Get package detail with linked services (public)
 *   PATCH  /api/packages/[id]   — Update package (admin only)
 *   DELETE /api/packages/[id]   — Soft delete package — set isActive=false (admin only)
 *
 * GET Response:
 *   200: { success: true, data: package } — Full package with linked services
 *
 * PATCH Request Body:
 *   All fields optional (partial of createPackageSchema)
 *
 * DELETE Response:
 *   200: { success: true, data: null, message: "Package deleted successfully" }
 *
 * Error Responses:
 *   403: { success: false, error: "PERM_ADMIN_REQUIRED" }
 *   404: { success: false, error: "RES_NOT_FOUND" }
 *   409: { success: false, error: "RES_CONFLICT" } — slug conflict
 */

import { createApiHandler } from "@/lib/api-handler";
import { prisma } from "@/lib/prisma";
import { requireActiveUser } from "@/lib/auth-helpers";
import { NotFoundError, ConflictError, AdminRequiredError } from "@/lib/errors";
import { updatePackageSchema } from "@/lib/validations/packages";

// ==================== Helper — extract [id] from URL ====================

function extractIdFromUrl(request: Request): string | null {
  const url = new URL(request.url);
  const segments = url.pathname.split("/");
  const idIndex = segments.indexOf("packages") + 1;
  return segments[idIndex] || null;
}

// ==================== GET — Package Detail (Public) ====================

export const GET = createApiHandler({
  schema: null,
  handler: async ({ request }) => {
    const id = extractIdFromUrl(request);
    if (!id) {
      throw new NotFoundError("Package not found");
    }

    const pkg = await prisma.package.findUnique({
      where: { id },
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

    if (!pkg) {
      throw new NotFoundError("Package not found");
    }

    // Return with serialized decimal values
    return {
      ...pkg,
      price: pkg.price.toString(),
      originalPrice: pkg.originalPrice.toString(),
      packageServices: pkg.packageServices.map((ps) => ({
        ...ps,
        service: {
          ...ps.service,
          price: ps.service.price.toString(),
        },
      })),
    };
  },
});

// ==================== PATCH — Update Package (Admin) ====================

export const PATCH = createApiHandler({
  schema: updatePackageSchema,
  successMessage: "Package updated successfully",
  handler: async ({ parsedBody, request }) => {
    const id = extractIdFromUrl(request);
    if (!id) {
      throw new NotFoundError("Package not found");
    }

    // 1. Verify admin access
    const { user } = await requireActiveUser(request);
    if (user.role !== "ADMIN") {
      throw new AdminRequiredError();
    }

    // 2. Check package exists
    const existingPackage = await prisma.package.findUnique({
      where: { id },
    });
    if (!existingPackage) {
      throw new NotFoundError("Package not found");
    }

    // 3. Check slug uniqueness if slug is being changed
    if (parsedBody.slug && parsedBody.slug !== existingPackage.slug) {
      const slugConflict = await prisma.package.findUnique({
        where: { slug: parsedBody.slug },
      });
      if (slugConflict) {
        throw new ConflictError("A package with this slug already exists");
      }
    }

    // 4. Build update data — only include fields that are provided
    const updateData: Record<string, unknown> = {};

    if (parsedBody.nameHi !== undefined) updateData.nameHi = parsedBody.nameHi;
    if (parsedBody.nameEn !== undefined) updateData.nameEn = parsedBody.nameEn;
    if (parsedBody.slug !== undefined) updateData.slug = parsedBody.slug;
    if (parsedBody.descriptionHi !== undefined) updateData.descriptionHi = parsedBody.descriptionHi;
    if (parsedBody.descriptionEn !== undefined) updateData.descriptionEn = parsedBody.descriptionEn || null;
    if (parsedBody.price !== undefined) updateData.price = parseFloat(parsedBody.price);
    if (parsedBody.originalPrice !== undefined) updateData.originalPrice = parseFloat(parsedBody.originalPrice);
    if (parsedBody.durationMinutes !== undefined) updateData.durationMinutes = parsedBody.durationMinutes;
    if (parsedBody.imageUrl !== undefined) updateData.imageUrl = parsedBody.imageUrl || null;
    if (parsedBody.branchId !== undefined) updateData.branchId = parsedBody.branchId;
    if (parsedBody.validFrom !== undefined) updateData.validFrom = parsedBody.validFrom ? new Date(parsedBody.validFrom) : null;
    if (parsedBody.validUntil !== undefined) updateData.validUntil = parsedBody.validUntil ? new Date(parsedBody.validUntil) : null;

    // 5. Update package
    const updatedPackage = await prisma.package.update({
      where: { id },
      data: updateData,
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

    // 6. Return updated package with serialized decimals
    return {
      ...updatedPackage,
      price: updatedPackage.price.toString(),
      originalPrice: updatedPackage.originalPrice.toString(),
      packageServices: updatedPackage.packageServices.map((ps) => ({
        ...ps,
        service: {
          ...ps.service,
          price: ps.service.price.toString(),
        },
      })),
    };
  },
});

// ==================== DELETE — Soft Delete Package (Admin) ====================

export const DELETE = createApiHandler({
  schema: null,
  successMessage: "Package deleted successfully",
  handler: async ({ request }) => {
    const id = extractIdFromUrl(request);
    if (!id) {
      throw new NotFoundError("Package not found");
    }

    // 1. Verify admin access
    const { user } = await requireActiveUser(request);
    if (user.role !== "ADMIN") {
      throw new AdminRequiredError();
    }

    // 2. Check package exists
    const existingPackage = await prisma.package.findUnique({
      where: { id },
    });
    if (!existingPackage) {
      throw new NotFoundError("Package not found");
    }

    // 3. Soft delete — set isActive = false
    await prisma.package.update({
      where: { id },
      data: { isActive: false },
    });

    return null;
  },
});
