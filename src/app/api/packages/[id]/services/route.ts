/**
 * Purpose: Package services management API endpoints
 * Responsibility: List linked services (public), bulk link services (admin), unlink service (admin)
 *
 * Endpoints:
 *   GET    /api/packages/[id]/services              — List services linked to package (public)
 *   POST   /api/packages/[id]/services              — Bulk link services to package (admin only)
 *   DELETE /api/packages/[id]/services?serviceId=   — Unlink a service from package (admin only)
 *
 * GET Response:
 *   200: { success: true, data: { services } }
 *   — Returns linked services with sortOrder and service details
 *
 * POST Request Body:
 *   { serviceIds: string[] } — At least 1 service ID
 *   — Skips already-linked services (no duplicate error)
 *   — Auto-assigns sortOrder (incremental from max existing)
 *
 * POST Response:
 *   200: { success: true, data: { linkedCount }, message }
 *
 * DELETE Query Params:
 *   serviceId (required) — The service to unlink
 *
 * DELETE Response:
 *   200: { success: true, data: null, message }
 *
 * Error Responses:
 *   403: { success: false, error: "PERM_ADMIN_REQUIRED" }
 *   404: { success: false, error: "RES_NOT_FOUND" } — package or service not found
 */

import { createApiHandler } from "@/lib/api-handler";
import { prisma } from "@/lib/prisma";
import { requireActiveUser } from "@/lib/auth-helpers";
import { NotFoundError, AdminRequiredError, ValidationError } from "@/lib/errors";
import { HTTP_STATUS } from "@/lib/http";
import { linkServicesSchema } from "@/lib/validations/packages";
import { cuid } from "@/lib/validations/common";

// ==================== Helper — extract package [id] from URL ====================

function extractPackageIdFromUrl(request: Request): string | null {
  const url = new URL(request.url);
  const segments = url.pathname.split("/");
  const packagesIndex = segments.indexOf("packages");
  if (packagesIndex === -1) return null;
  return segments[packagesIndex + 1] || null;
}

// ==================== GET — List Linked Services (Public) ====================

export const GET = createApiHandler({
  schema: null,
  handler: async ({ request }) => {
    const packageId = extractPackageIdFromUrl(request);
    if (!packageId) {
      throw new NotFoundError("Package not found");
    }

    // 1. Check package exists
    const pkg = await prisma.package.findUnique({
      where: { id: packageId },
    });
    if (!pkg) {
      throw new NotFoundError("Package not found");
    }

    // 2. Fetch linked services with service details
    const packageServices = await prisma.packageService.findMany({
      where: { packageId },
      include: {
        service: {
          select: {
            id: true,
            nameHi: true,
            nameEn: true,
            price: true,
            durationMinutes: true,
            imageUrl: true,
            isActive: true,
          },
        },
      },
      orderBy: { sortOrder: "asc" },
    });

    // 3. Return with serialized decimal values
    return {
      services: packageServices.map((ps) => ({
        id: ps.id,
        packageId: ps.packageId,
        serviceId: ps.serviceId,
        sortOrder: ps.sortOrder,
        service: {
          ...ps.service,
          price: ps.service.price.toString(),
        },
      })),
    };
  },
});

// ==================== POST — Bulk Link Services (Admin) ====================

export const POST = createApiHandler({
  schema: linkServicesSchema,
  successMessage: "Services linked to package successfully",
  handler: async ({ parsedBody, request }) => {
    const packageId = extractPackageIdFromUrl(request);
    if (!packageId) {
      throw new NotFoundError("Package not found");
    }

    // 1. Verify admin access
    const { user } = await requireActiveUser(request);
    if (user.role !== "ADMIN") {
      throw new AdminRequiredError();
    }

    // 2. Check package exists
    const pkg = await prisma.package.findUnique({
      where: { id: packageId },
    });
    if (!pkg) {
      throw new NotFoundError("Package not found");
    }

    const { serviceIds } = parsedBody;

    // 3. Verify all serviceIds exist
    const existingServices = await prisma.service.findMany({
      where: {
        id: { in: serviceIds },
      },
      select: { id: true },
    });

    const existingServiceIds = new Set(existingServices.map((s) => s.id));
    const invalidIds = serviceIds.filter((id: string) => !existingServiceIds.has(id));
    if (invalidIds.length > 0) {
      throw new NotFoundError(`Services not found: ${invalidIds.join(", ")}`);
    }

    // 4. Find already-linked services to skip duplicates
    const alreadyLinked = await prisma.packageService.findMany({
      where: {
        packageId,
        serviceId: { in: serviceIds },
      },
      select: { serviceId: true },
    });
    const linkedServiceIds = new Set(alreadyLinked.map((ps) => ps.serviceId));

    // 5. Get current max sortOrder for incremental assignment
    const maxSortResult = await prisma.packageService.findFirst({
      where: { packageId },
      orderBy: { sortOrder: "desc" },
      select: { sortOrder: true },
    });
    let nextSortOrder = (maxSortResult?.sortOrder ?? -1) + 1;

    // 6. Create PackageService records for new links only
    const newLinks = serviceIds.filter((id: string) => !linkedServiceIds.has(id));

    if (newLinks.length > 0) {
      await prisma.packageService.createMany({
        data: newLinks.map((serviceId: string) => ({
          packageId,
          serviceId,
          sortOrder: nextSortOrder++,
        })),
      });
    }

    // 7. Return count of newly linked services
    return {
      linkedCount: newLinks.length,
      skippedCount: linkedServiceIds.size,
    };
  },
});

// ==================== DELETE — Unlink Service (Admin) ====================

export const DELETE = createApiHandler({
  schema: null,
  successMessage: "Service unlinked from package successfully",
  handler: async ({ request }) => {
    const packageId = extractPackageIdFromUrl(request);
    if (!packageId) {
      throw new NotFoundError("Package not found");
    }

    // 1. Verify admin access
    const { user } = await requireActiveUser(request);
    if (user.role !== "ADMIN") {
      throw new AdminRequiredError();
    }

    // 2. Extract serviceId from query params
    const url = new URL(request.url);
    const serviceId = url.searchParams.get("serviceId");

    if (!serviceId) {
      // Validate that serviceId is provided
      const validationResult = cuid.safeParse(serviceId);
      if (!validationResult.success) {
        return Response.json(
          {
            success: false,
            error: "VAL_INVALID_INPUT",
            message: "serviceId query parameter is required",
            statusCode: HTTP_STATUS.BAD_REQUEST,
          },
          { status: HTTP_STATUS.BAD_REQUEST }
        );
      }
    }

    // Validate serviceId format
    const serviceIdValidation = cuid.safeParse(serviceId);
    if (!serviceIdValidation.success) {
      throw new ValidationError("serviceId must be a valid ID");
    }

    // 3. Check package exists
    const pkg = await prisma.package.findUnique({
      where: { id: packageId },
    });
    if (!pkg) {
      throw new NotFoundError("Package not found");
    }

    // 4. Find and delete the PackageService junction record
    const packageService = await prisma.packageService.findFirst({
      where: {
        packageId,
        serviceId: serviceId!,
      },
    });

    if (!packageService) {
      throw new NotFoundError("Service is not linked to this package");
    }

    await prisma.packageService.delete({
      where: { id: packageService.id },
    });

    return null;
  },
});
