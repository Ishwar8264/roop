/**
 * Purpose: Service AddOns list and create API endpoints
 * Responsibility: List add-ons for a service (public) and add new add-ons (admin)
 *
 * Endpoints:
 *   GET  /api/services/[id]/addons        — List add-ons for a service (public)
 *   POST /api/services/[id]/addons        — Add a new add-on to a service (admin only)
 *
 * GET Response:
 *   200: { success: true, data: { addons } }
 *
 * POST Request Body:
 *   nameHi, nameEn, price, durationMinutes
 *
 * Responses:
 *   201: { success: true, data: addon, message }
 *   403: { success: false, error: "PERM_ADMIN_REQUIRED", message }
 *   404: { success: false, error: "RES_NOT_FOUND", message }
 */

import { createApiHandler } from "@/lib/api-handler";
import { prisma } from "@/lib/prisma";
import { requireActiveUser } from "@/lib/auth-helpers";
import { NotFoundError, AdminRequiredError } from "@/lib/errors";
import { HTTP_STATUS } from "@/lib/http";
import { createAddOnSchema } from "@/lib/validations/services";

// ==================== Helper — extract service [id] from URL ====================

function extractServiceIdFromUrl(request: Request): string | null {
  const url = new URL(request.url);
  const segments = url.pathname.split("/");
  const idIndex = segments.indexOf("services") + 1;
  return segments[idIndex] || null;
}

// ==================== GET — List AddOns (Public) ====================

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

    // 2. Fetch active add-ons
    const addons = await prisma.serviceAddOn.findMany({
      where: {
        serviceId,
        isActive: true,
      },
      orderBy: { createdAt: "asc" },
    });

    // 3. Return with serialized decimals
    return {
      addons: addons.map((a) => ({
        ...a,
        price: a.price.toString(),
      })),
    };
  },
});

// ==================== POST — Add AddOn (Admin) ====================

export const POST = createApiHandler({
  schema: createAddOnSchema,
  successMessage: "Service add-on created successfully",
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

    // 3. Create add-on
    const newAddOn = await prisma.serviceAddOn.create({
      data: {
        serviceId,
        nameHi: parsedBody.nameHi,
        nameEn: parsedBody.nameEn,
        price: parseFloat(parsedBody.price),
        durationMinutes: parsedBody.durationMinutes,
      },
    });

    // 4. Return with serialized decimal
    return {
      ...newAddOn,
      price: newAddOn.price.toString(),
    };
  },
});
