/**
 * Purpose: Offer detail, update, and soft-delete API endpoints
 * Responsibility: Get offer detail (public), update offer (admin), soft-delete offer (admin)
 *
 * Endpoints:
 *   GET    /api/offers/[id]   — Get offer detail (public)
 *   PATCH  /api/offers/[id]   — Update offer (admin only)
 *   DELETE /api/offers/[id]   — Soft delete offer — set isActive=false (admin only)
 *
 * GET Response:
 *   200: { success: true, data: offer } — Full offer with linked services
 *
 * PATCH Request Body:
 *   All fields optional (partial of createOfferSchema)
 *
 * DELETE Response:
 *   200: { success: true, data: null, message: "Offer deleted successfully" }
 *
 * Error Responses:
 *   403: { success: false, error: "PERM_ADMIN_REQUIRED" }
 *   404: { success: false, error: "RES_NOT_FOUND" }
 *   409: { success: false, error: "RES_CONFLICT" } — code conflict
 */

import { createApiHandler } from "@/lib/api-handler";
import { prisma } from "@/lib/prisma";
import { requireActiveUser } from "@/lib/auth-helpers";
import { NotFoundError, ConflictError, AdminRequiredError } from "@/lib/errors";
import { updateOfferSchema } from "@/lib/validations/offers";

// ==================== Helper — extract [id] from URL ====================

function extractIdFromUrl(request: Request): string | null {
  const url = new URL(request.url);
  const segments = url.pathname.split("/");
  const idIndex = segments.indexOf("offers") + 1;
  return segments[idIndex] || null;
}

// ==================== GET — Offer Detail (Public) ====================

export const GET = createApiHandler({
  schema: null,
  handler: async ({ request }) => {
    const id = extractIdFromUrl(request);
    if (!id) {
      throw new NotFoundError("Offer not found");
    }

    const offer = await prisma.offer.findUnique({
      where: { id },
      include: {
        offerServices: {
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
        },
      },
    });

    if (!offer) {
      throw new NotFoundError("Offer not found");
    }

    // Return with serialized decimal values
    return {
      ...offer,
      discountValue: offer.discountValue.toString(),
      minOrder: offer.minOrder?.toString() ?? null,
      maxDiscount: offer.maxDiscount?.toString() ?? null,
      offerServices: offer.offerServices.map((os) => ({
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

// ==================== PATCH — Update Offer (Admin) ====================

export const PATCH = createApiHandler({
  schema: updateOfferSchema,
  successMessage: "Offer updated successfully",
  handler: async ({ parsedBody, request }) => {
    const id = extractIdFromUrl(request);
    if (!id) {
      throw new NotFoundError("Offer not found");
    }

    // 1. Verify admin access
    const { user } = await requireActiveUser(request);
    if (user.role !== "ADMIN") {
      throw new AdminRequiredError();
    }

    // 2. Check offer exists
    const existingOffer = await prisma.offer.findUnique({
      where: { id },
    });
    if (!existingOffer) {
      throw new NotFoundError("Offer not found");
    }

    // 3. Check code uniqueness if code is being changed
    if (parsedBody.code && parsedBody.code !== existingOffer.code) {
      const codeConflict = await prisma.offer.findUnique({
        where: { code: parsedBody.code },
      });
      if (codeConflict) {
        throw new ConflictError("An offer with this promo code already exists");
      }
    }

    // 4. Build update data — only include fields that are provided
    const updateData: Record<string, unknown> = {};

    if (parsedBody.code !== undefined) updateData.code = parsedBody.code;
    if (parsedBody.titleHi !== undefined) updateData.titleHi = parsedBody.titleHi;
    if (parsedBody.titleEn !== undefined) updateData.titleEn = parsedBody.titleEn || null;
    if (parsedBody.descriptionHi !== undefined) updateData.descriptionHi = parsedBody.descriptionHi || null;
    if (parsedBody.descriptionEn !== undefined) updateData.descriptionEn = parsedBody.descriptionEn || null;
    if (parsedBody.discountType !== undefined) updateData.discountType = parsedBody.discountType;
    if (parsedBody.discountValue !== undefined) updateData.discountValue = parseFloat(parsedBody.discountValue);
    if (parsedBody.minOrder !== undefined) updateData.minOrder = parsedBody.minOrder ? parseFloat(parsedBody.minOrder) : null;
    if (parsedBody.maxDiscount !== undefined) updateData.maxDiscount = parsedBody.maxDiscount ? parseFloat(parsedBody.maxDiscount) : null;
    if (parsedBody.validFrom !== undefined) updateData.validFrom = new Date(parsedBody.validFrom);
    if (parsedBody.validUntil !== undefined) updateData.validUntil = new Date(parsedBody.validUntil);
    if (parsedBody.usageLimit !== undefined) updateData.usageLimit = parsedBody.usageLimit || null;

    // 5. Update offer
    const updatedOffer = await prisma.offer.update({
      where: { id },
      data: updateData,
      include: {
        offerServices: {
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
        },
      },
    });

    // 6. Return updated offer with serialized decimals
    return {
      ...updatedOffer,
      discountValue: updatedOffer.discountValue.toString(),
      minOrder: updatedOffer.minOrder?.toString() ?? null,
      maxDiscount: updatedOffer.maxDiscount?.toString() ?? null,
      offerServices: updatedOffer.offerServices.map((os) => ({
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

// ==================== DELETE — Soft Delete Offer (Admin) ====================

export const DELETE = createApiHandler({
  schema: null,
  successMessage: "Offer deleted successfully",
  handler: async ({ request }) => {
    const id = extractIdFromUrl(request);
    if (!id) {
      throw new NotFoundError("Offer not found");
    }

    // 1. Verify admin access
    const { user } = await requireActiveUser(request);
    if (user.role !== "ADMIN") {
      throw new AdminRequiredError();
    }

    // 2. Check offer exists
    const existingOffer = await prisma.offer.findUnique({
      where: { id },
    });
    if (!existingOffer) {
      throw new NotFoundError("Offer not found");
    }

    // 3. Soft delete — set isActive = false
    await prisma.offer.update({
      where: { id },
      data: { isActive: false },
    });

    return null;
  },
});
