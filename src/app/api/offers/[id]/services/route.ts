/**
 * Purpose: Offer services management API endpoints
 * Responsibility: List linked services (public), bulk link services (admin), unlink service (admin)
 *
 * Endpoints:
 *   GET    /api/offers/[id]/services              — List services linked to offer (public)
 *   POST   /api/offers/[id]/services              — Bulk link services to offer (admin only)
 *   DELETE /api/offers/[id]/services?serviceId=   — Unlink a service from offer (admin only)
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
 *   404: { success: false, error: "RES_NOT_FOUND" } — offer or service not found
 */

import { createApiHandler } from "@/lib/api-handler";
import { prisma } from "@/lib/prisma";
import { requireActiveUser } from "@/lib/auth-helpers";
import { NotFoundError, AdminRequiredError, ValidationError } from "@/lib/errors";
import { HTTP_STATUS } from "@/lib/http";
import { linkOfferServicesSchema } from "@/lib/validations/offers";
import { cuid } from "@/lib/validations/common";

// ==================== Helper — extract offer [id] from URL ====================

function extractOfferIdFromUrl(request: Request): string | null {
  const url = new URL(request.url);
  const segments = url.pathname.split("/");
  const offersIndex = segments.indexOf("offers");
  if (offersIndex === -1) return null;
  return segments[offersIndex + 1] || null;
}

// ==================== GET — List Linked Services (Public) ====================

export const GET = createApiHandler({
  schema: null,
  handler: async ({ request }) => {
    const offerId = extractOfferIdFromUrl(request);
    if (!offerId) {
      throw new NotFoundError("Offer not found");
    }

    // 1. Check offer exists
    const offer = await prisma.offer.findUnique({
      where: { id: offerId },
    });
    if (!offer) {
      throw new NotFoundError("Offer not found");
    }

    // 2. Fetch linked services with service details
    const offerServices = await prisma.offerService.findMany({
      where: { offerId },
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
    });

    // 3. Return with serialized decimal values
    return {
      services: offerServices.map((os) => ({
        id: os.id,
        offerId: os.offerId,
        serviceId: os.serviceId,
        service: {
          ...os.service,
          price: os.service.price.toString(),
        },
      })),
    };
  },
});

// ==================== POST — Bulk Link Services (Admin) ====================

export const POST = createApiHandler({
  schema: linkOfferServicesSchema,
  successMessage: "Services linked to offer successfully",
  handler: async ({ parsedBody, request }) => {
    const offerId = extractOfferIdFromUrl(request);
    if (!offerId) {
      throw new NotFoundError("Offer not found");
    }

    // 1. Verify admin access
    const { user } = await requireActiveUser(request);
    if (user.role !== "ADMIN") {
      throw new AdminRequiredError();
    }

    // 2. Check offer exists
    const offer = await prisma.offer.findUnique({
      where: { id: offerId },
    });
    if (!offer) {
      throw new NotFoundError("Offer not found");
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
    const alreadyLinked = await prisma.offerService.findMany({
      where: {
        offerId,
        serviceId: { in: serviceIds },
      },
      select: { serviceId: true },
    });
    const linkedServiceIds = new Set(alreadyLinked.map((os) => os.serviceId));

    // 5. Create OfferService records for new links only
    const newLinks = serviceIds.filter((id: string) => !linkedServiceIds.has(id));

    if (newLinks.length > 0) {
      await prisma.offerService.createMany({
        data: newLinks.map((serviceId: string) => ({
          offerId,
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
  successMessage: "Service unlinked from offer successfully",
  handler: async ({ request }) => {
    const offerId = extractOfferIdFromUrl(request);
    if (!offerId) {
      throw new NotFoundError("Offer not found");
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

    // 3. Check offer exists
    const offer = await prisma.offer.findUnique({
      where: { id: offerId },
    });
    if (!offer) {
      throw new NotFoundError("Offer not found");
    }

    // 4. Find and delete the OfferService junction record
    const offerService = await prisma.offerService.findFirst({
      where: {
        offerId,
        serviceId,
      },
    });

    if (!offerService) {
      throw new NotFoundError("Service is not linked to this offer");
    }

    await prisma.offerService.delete({
      where: { id: offerService.id },
    });

    return null;
  },
});
