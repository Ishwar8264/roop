/**
 * Purpose: Offer service unlink API endpoint
 * Responsibility: Remove one linked service from an offer for admins
 * Important Notes: Extracts offer and service IDs from the App Router pathname.
 */

import { createApiHandler } from "@/lib/api-handler";
import { requireActiveUser } from "@/lib/auth-helpers";
import { AdminRequiredError, NotFoundError, ValidationError } from "@/lib/errors";
import { prisma } from "@/lib/prisma";
import { cuid } from "@/lib/validations/common";

function extractOfferServiceIdsFromUrl(request: Request) {
  const url = new URL(request.url);
  const segments = url.pathname.split("/").filter(Boolean);
  const offersIndex = segments.indexOf("offers");

  return {
    offerId: offersIndex >= 0 ? segments[offersIndex + 1] : undefined,
    serviceId: offersIndex >= 0 ? segments[offersIndex + 3] : undefined,
  };
}

// ==================== DELETE — Unlink Service (Admin) ====================

export const DELETE = createApiHandler({
  schema: null,
  successMessage: "Service unlinked from offer successfully",
  handler: async ({ request }) => {
    const { user } = await requireActiveUser(request);
    if (user.role !== "ADMIN") {
      throw new AdminRequiredError();
    }

    const { offerId, serviceId } = extractOfferServiceIdsFromUrl(request);
    if (!offerId || !serviceId) {
      throw new NotFoundError("Offer service link not found");
    }

    if (!cuid.safeParse(offerId).success || !cuid.safeParse(serviceId).success) {
      throw new ValidationError("offerId and serviceId must be valid IDs");
    }

    const offerService = await prisma.offerService.findFirst({
      where: { offerId, serviceId },
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
