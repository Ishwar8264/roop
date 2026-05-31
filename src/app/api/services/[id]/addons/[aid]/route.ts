/**
 * Purpose: Service AddOn update and delete API endpoints
 * Responsibility: Update an add-on (admin) and delete an add-on (admin)
 *
 * Endpoints:
 *   PATCH  /api/services/[id]/addons/[aid]   — Update add-on (admin only)
 *   DELETE /api/services/[id]/addons/[aid]   — Delete add-on (admin only — hard delete)
 *
 * PATCH Request Body:
 *   All fields optional (partial of createAddOnSchema)
 *
 * DELETE Response:
 *   200: { success: true, data: null, message: "Service add-on deleted successfully" }
 *
 * Error Responses:
 *   403: { success: false, error: "PERM_ADMIN_REQUIRED" }
 *   404: { success: false, error: "RES_NOT_FOUND" }
 */

import { createApiHandler } from "@/lib/api-handler";
import { prisma } from "@/lib/prisma";
import { requireActiveUser } from "@/lib/auth-helpers";
import { NotFoundError, AdminRequiredError } from "@/lib/errors";
import { updateAddOnSchema } from "@/lib/validations/services";

// ==================== Helper — extract service [id] and addon [aid] from URL ====================

function extractIdsFromUrl(request: Request): { serviceId: string | null; addOnId: string | null } {
  const url = new URL(request.url);
  const segments = url.pathname.split("/");
  const serviceIndex = segments.indexOf("services") + 1;
  const addonIndex = segments.indexOf("addons") + 1;
  return {
    serviceId: segments[serviceIndex] || null,
    addOnId: segments[addonIndex] || null,
  };
}

// ==================== PATCH — Update AddOn (Admin) ====================

export const PATCH = createApiHandler({
  schema: updateAddOnSchema,
  successMessage: "Service add-on updated successfully",
  handler: async ({ parsedBody, request }) => {
    const { serviceId, addOnId } = extractIdsFromUrl(request);
    if (!serviceId || !addOnId) {
      throw new NotFoundError("Service add-on not found");
    }

    // 1. Verify admin access
    const { user } = await requireActiveUser(request);
    if (user.role !== "ADMIN") {
      throw new AdminRequiredError();
    }

    // 2. Check add-on exists and belongs to the service
    const existingAddOn = await prisma.serviceAddOn.findUnique({
      where: { id: addOnId },
    });
    if (!existingAddOn || existingAddOn.serviceId !== serviceId) {
      throw new NotFoundError("Service add-on not found");
    }

    // 3. Build update data — only include fields that are provided
    const updateData: Record<string, unknown> = {};

    if (parsedBody.nameHi !== undefined) updateData.nameHi = parsedBody.nameHi;
    if (parsedBody.nameEn !== undefined) updateData.nameEn = parsedBody.nameEn;
    if (parsedBody.price !== undefined) updateData.price = parseFloat(parsedBody.price);
    if (parsedBody.durationMinutes !== undefined) updateData.durationMinutes = parsedBody.durationMinutes;

    // 4. Update add-on
    const updatedAddOn = await prisma.serviceAddOn.update({
      where: { id: addOnId },
      data: updateData,
    });

    // 5. Return with serialized decimal
    return {
      ...updatedAddOn,
      price: updatedAddOn.price.toString(),
    };
  },
});

// ==================== DELETE — Delete AddOn (Admin) ====================

export const DELETE = createApiHandler({
  schema: null,
  successMessage: "Service add-on deleted successfully",
  handler: async ({ request }) => {
    const { serviceId, addOnId } = extractIdsFromUrl(request);
    if (!serviceId || !addOnId) {
      throw new NotFoundError("Service add-on not found");
    }

    // 1. Verify admin access
    const { user } = await requireActiveUser(request);
    if (user.role !== "ADMIN") {
      throw new AdminRequiredError();
    }

    // 2. Check add-on exists and belongs to the service
    const existingAddOn = await prisma.serviceAddOn.findUnique({
      where: { id: addOnId },
    });
    if (!existingAddOn || existingAddOn.serviceId !== serviceId) {
      throw new NotFoundError("Service add-on not found");
    }

    // 3. Hard delete the add-on (as specified in the task)
    await prisma.serviceAddOn.delete({
      where: { id: addOnId },
    });

    return null;
  },
});
