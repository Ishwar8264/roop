/**
 * Purpose: Service Variants list and create API endpoints
 * Responsibility: List variants for a service (public) and add new variants (admin)
 *
 * Endpoints:
 *   GET  /api/services/[id]/variants        — List variants for a service (public)
 *   POST /api/services/[id]/variants        — Add a new variant to a service (admin only)
 *
 * GET Response:
 *   200: { success: true, data: { variants } }
 *
 * POST Request Body:
 *   nameHi, nameEn, price, durationMinutes, sortOrder (optional)
 *
 * Responses:
 *   201: { success: true, data: variant, message }
 *   403: { success: false, error: "PERM_ADMIN_REQUIRED", message }
 *   404: { success: false, error: "RES_NOT_FOUND", message }
 */

import { createApiHandler } from "@/lib/api-handler";
import { prisma } from "@/lib/prisma";
import { requireActiveUser } from "@/lib/auth-helpers";
import { NotFoundError, AdminRequiredError } from "@/lib/errors";
import { HTTP_STATUS } from "@/lib/http";
import { createVariantSchema } from "@/lib/validations/services";

// ==================== Helper — extract service [id] from URL ====================

function extractServiceIdFromUrl(request: Request): string | null {
  const url = new URL(request.url);
  const segments = url.pathname.split("/");
  const idIndex = segments.indexOf("services") + 1;
  return segments[idIndex] || null;
}

// ==================== GET — List Variants (Public) ====================

export const GET = createApiHandler({
  schema: null,
  handler: async ({ request }) => {
    const serviceId = extractServiceIdFromUrl(request);
    if (!serviceId) {
      throw new NotFoundError("Service not found");
    }

    // 1. Check service exists
    const service = await prisma.service.findUnique({
      where: { id: serviceId },
    });
    if (!service) {
      throw new NotFoundError("Service not found");
    }

    // 2. Fetch active variants ordered by sortOrder
    const variants = await prisma.serviceVariant.findMany({
      where: {
        serviceId,
        isActive: true,
      },
      orderBy: { sortOrder: "asc" },
    });

    // 3. Return with serialized decimals
    return {
      variants: variants.map((v) => ({
        ...v,
        price: v.price.toString(),
      })),
    };
  },
});

// ==================== POST — Add Variant (Admin) ====================

export const POST = createApiHandler({
  schema: createVariantSchema,
  successMessage: "Service variant created successfully",
  successStatus: HTTP_STATUS.CREATED,
  handler: async ({ parsedBody, request }) => {
    const serviceId = extractServiceIdFromUrl(request);
    if (!serviceId) {
      throw new NotFoundError("Service not found");
    }

    // 1. Verify admin access
    const { user } = await requireActiveUser(request);
    if (user.role !== "ADMIN") {
      throw new AdminRequiredError();
    }

    // 2. Check service exists
    const service = await prisma.service.findUnique({
      where: { id: serviceId },
    });
    if (!service) {
      throw new NotFoundError("Service not found");
    }

    // 3. Create variant
    const newVariant = await prisma.serviceVariant.create({
      data: {
        serviceId,
        nameHi: parsedBody.nameHi,
        nameEn: parsedBody.nameEn,
        price: parseFloat(parsedBody.price),
        durationMinutes: parsedBody.durationMinutes,
        sortOrder: parsedBody.sortOrder ?? 0,
      },
    });

    // 4. Return with serialized decimal
    return {
      ...newVariant,
      price: newVariant.price.toString(),
    };
  },
});
