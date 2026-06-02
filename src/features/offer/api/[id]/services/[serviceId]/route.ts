/**
 * Purpose: Unlink service from offer
 * Endpoint: DELETE /api/offers/[id]/services/[serviceId] (ADMIN only)
 */

import { createApiHandler } from "@/lib/server/api-handler";
import {
  unlinkService,
  requireAdmin,
  extractOfferIdFromUrl,
  extractServiceIdFromOfferUrl,
} from "@/features/offer/services/offer-service";

export const DELETE = createApiHandler<null, Awaited<ReturnType<typeof unlinkService>>>({
  schema: null,
  authHook: requireAdmin,
  handler: async ({ request }) => {
    const offerId = extractOfferIdFromUrl(request.url);
    const serviceId = extractServiceIdFromOfferUrl(request.url);
    return unlinkService(offerId, serviceId);
  },
  successMessage: "सेवा सफलतापूर्वक अनलिंक की गई। / Service unlinked successfully.",
});
