/**
 * Purpose: Service Variant update and delete API endpoints
 * Responsibility: Update a variant (admin) and delete a variant (admin)
 *
 * Endpoints:
 *   PATCH  /api/services/[id]/variants/[vid]   — Update variant (admin only)
 *   DELETE /api/services/[id]/variants/[vid]   — Delete variant (admin only — hard delete)
 *
 * PATCH Request Body:
 *   All fields optional (partial of createVariantSchema)
 *
 * DELETE Response:
 *   200: { success: true, data: null, message: "Service variant deleted successfully" }
 *
 * Error Responses:
 *   403: { success: false, error: "PERM_ADMIN_REQUIRED" }
 *   404: { success: false, error: "RES_NOT_FOUND" }
 */

import { createApiHandler } from "@/lib/api-handler";
import { prisma } from "@/lib/prisma";
import { requireActiveUser } from "@/lib/auth-helpers";
import { NotFoundError, AdminRequiredError } from "@/lib/errors";
import { updateVariantSchema } from "@/lib/validations/services";

// ==================== Helper — extract service [id] and variant [vid] from URL ====================

function extractIdsFromUrl(request: Request): { serviceId: string | null; variantId: string | null } {
  const url = new URL(request.url);
  const segments = url.pathname.split("/");
  const serviceIndex = segments.indexOf("services") + 1;
  const variantIndex = segments.indexOf("variants") + 1;
  return {
    serviceId: segments[serviceIndex] || null,
    variantId: segments[variantIndex] || null,
  };
}

// ==================== PATCH — Update Variant (Admin) ====================

export const PATCH = createApiHandler({
  schema: updateVariantSchema,
  successMessage: "Service variant updated successfully",
  handler: async ({ parsedBody, request }) => {
    const { serviceId, variantId } = extractIdsFromUrl(request);
    if (!serviceId || !variantId) {
      throw new NotFoundError("Service variant not found");
    }

    // 1. Verify admin access
    const { user } = await requireActiveUser(request);
    if (user.role !== "ADMIN") {
      throw new AdminRequiredError();
    }

    // 2. Check variant exists and belongs to the service
    const existingVariant = await prisma.serviceVariant.findUnique({
      where: { id: variantId },
    });
    if (!existingVariant || existingVariant.serviceId !== serviceId) {
      throw new NotFoundError("Service variant not found");
    }

    // 3. Build update data — only include fields that are provided
    const updateData: Record<string, unknown> = {};

    if (parsedBody.nameHi !== undefined) updateData.nameHi = parsedBody.nameHi;
    if (parsedBody.nameEn !== undefined) updateData.nameEn = parsedBody.nameEn;
    if (parsedBody.price !== undefined) updateData.price = parseFloat(parsedBody.price);
    if (parsedBody.durationMinutes !== undefined) updateData.durationMinutes = parsedBody.durationMinutes;
    if (parsedBody.sortOrder !== undefined) updateData.sortOrder = parsedBody.sortOrder;

    // 4. Update variant
    const updatedVariant = await prisma.serviceVariant.update({
      where: { id: variantId },
      data: updateData,
    });

    // 5. Return with serialized decimal
    return {
      ...updatedVariant,
      price: updatedVariant.price.toString(),
    };
  },
});

// ==================== DELETE — Delete Variant (Admin) ====================

export const DELETE = createApiHandler({
  schema: null,
  successMessage: "Service variant deleted successfully",
  handler: async ({ request }) => {
    const { serviceId, variantId } = extractIdsFromUrl(request);
    if (!serviceId || !variantId) {
      throw new NotFoundError("Service variant not found");
    }

    // 1. Verify admin access
    const { user } = await requireActiveUser(request);
    if (user.role !== "ADMIN") {
      throw new AdminRequiredError();
    }

    // 2. Check variant exists and belongs to the service
    const existingVariant = await prisma.serviceVariant.findUnique({
      where: { id: variantId },
    });
    if (!existingVariant || existingVariant.serviceId !== serviceId) {
      throw new NotFoundError("Service variant not found");
    }

    // 3. Hard delete the variant (as specified in the task)
    await prisma.serviceVariant.delete({
      where: { id: variantId },
    });

    return null;
  },
});
