/**
 * Purpose: Staff services management API endpoints
 * Responsibility: List staff's services (public), link services (admin), unlink service (admin)
 *
 * Endpoints:
 *   GET    /api/staff/[id]/services              — List services linked to staff (public)
 *   POST   /api/staff/[id]/services              — Bulk link services to staff (admin only)
 *   DELETE /api/staff/[id]/services?serviceId=   — Unlink a service from staff (admin only)
 *
 * GET Response:
 *   200: { success: true, data: { services } }
 *   — Returns linked services with service details
 *
 * POST Request Body:
 *   { serviceIds: string[] } — At least 1 service ID
 *   — Skips already-linked services (no duplicate error)
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
 *   404: { success: false, error: "RES_NOT_FOUND" }
 */

import { createApiHandler } from "@/lib/api-handler";
import { prisma } from "@/lib/prisma";
import { requireActiveUser } from "@/lib/auth-helpers";
import { NotFoundError, AdminRequiredError, ValidationError } from "@/lib/errors";
import { HTTP_STATUS } from "@/lib/http";
import { linkStaffServicesSchema } from "@/lib/validations/staff";
import { cuid } from "@/lib/validations/common";

// ==================== Helper — extract staff [id] from URL ====================

function extractStaffIdFromUrl(request: Request): string | null {
  const url = new URL(request.url);
  const segments = url.pathname.split("/");
  const staffIndex = segments.indexOf("staff");
  if (staffIndex === -1) return null;
  return segments[staffIndex + 1] || null;
}

// ==================== GET — List Staff Services (Public) ====================

export const GET = createApiHandler({
  schema: null,
  handler: async ({ request }) => {
    const staffId = extractStaffIdFromUrl(request);
    if (!staffId) {
      throw new NotFoundError("Staff not found");
    }

    // 1. Check staff exists
    const staff = await prisma.staff.findUnique({
      where: { id: staffId },
    });
    if (!staff) {
      throw new NotFoundError("Staff not found");
    }

    // 2. Fetch linked services with service details
    const staffServices = await prisma.staffService.findMany({
      where: { staffId },
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
            branchId: true,
            category: {
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

    // 3. Return with serialized decimal values
    return {
      services: staffServices.map((ss) => ({
        id: ss.id,
        staffId: ss.staffId,
        serviceId: ss.serviceId,
        service: {
          ...ss.service,
          price: ss.service.price.toString(),
        },
      })),
    };
  },
});

// ==================== POST — Bulk Link Services (Admin) ====================

export const POST = createApiHandler({
  schema: linkStaffServicesSchema,
  successMessage: "Services linked to staff successfully",
  handler: async ({ parsedBody, request }) => {
    const staffId = extractStaffIdFromUrl(request);
    if (!staffId) {
      throw new NotFoundError("Staff not found");
    }

    // 1. Verify admin access
    const { user } = await requireActiveUser(request);
    if (user.role !== "ADMIN") {
      throw new AdminRequiredError();
    }

    // 2. Check staff exists
    const staff = await prisma.staff.findUnique({
      where: { id: staffId },
    });
    if (!staff) {
      throw new NotFoundError("Staff not found");
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
    const alreadyLinked = await prisma.staffService.findMany({
      where: {
        staffId,
        serviceId: { in: serviceIds },
      },
      select: { serviceId: true },
    });
    const linkedServiceIds = new Set(alreadyLinked.map((ss) => ss.serviceId));

    // 5. Create StaffService records for new links only
    const newLinks = serviceIds.filter((id: string) => !linkedServiceIds.has(id));

    if (newLinks.length > 0) {
      await prisma.staffService.createMany({
        data: newLinks.map((serviceId: string) => ({
          staffId,
          serviceId,
        })),
      });
    }

    // 6. Return count of newly linked services
    return {
      linkedCount: newLinks.length,
      skippedCount: linkedServiceIds.size,
    };
  },
});

// ==================== DELETE — Unlink Service (Admin) ====================

export const DELETE = createApiHandler({
  schema: null,
  successMessage: "Service unlinked from staff successfully",
  handler: async ({ request }) => {
    const staffId = extractStaffIdFromUrl(request);
    if (!staffId) {
      throw new NotFoundError("Staff not found");
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

    // Validate serviceId format
    const serviceIdValidation = cuid.safeParse(serviceId);
    if (!serviceIdValidation.success) {
      throw new ValidationError("serviceId must be a valid ID");
    }

    // 3. Check staff exists
    const staff = await prisma.staff.findUnique({
      where: { id: staffId },
    });
    if (!staff) {
      throw new NotFoundError("Staff not found");
    }

    // 4. Find and delete the StaffService junction record
    const staffService = await prisma.staffService.findFirst({
      where: {
        staffId,
        serviceId: serviceId!,
      },
    });

    if (!staffService) {
      throw new NotFoundError("Service is not linked to this staff");
    }

    await prisma.staffService.delete({
      where: { id: staffService.id },
    });

    return null;
  },
});
