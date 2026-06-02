/**
 * Purpose: Offer service link list + bulk link endpoints
 * Endpoints:
 *   GET  /api/offers/[id]/services  — List services linked to offer (Public)
 *   POST /api/offers/[id]/services  — Bulk link services to offer (ADMIN only)
 */

import { createApiHandler } from "@/lib/server/api-handler";
import { linkServicesSchema } from "@/features/offer/validations/offer";
import {
  listOfferServices,
  linkServices,
  requireAdmin,
  extractOfferIdFromUrl,
} from "@/features/offer/services/offer-service";
import type { LinkServicesInput } from "@/features/offer/validations/offer";

// ==================== GET — LIST OFFER SERVICES (PUBLIC) ====================

export const GET = createApiHandler<null, Awaited<ReturnType<typeof listOfferServices>>>({
  schema: null,
  handler: async ({ request }) => {
    const offerId = extractOfferIdFromUrl(request.url);
    return listOfferServices(offerId);
  },
  successMessage: "ऑफर सेवाएँ सफलतापूर्वक प्राप्त हुईं। / Offer services fetched successfully.",
});

// ==================== POST — BULK LINK SERVICES (ADMIN ONLY) ====================

export const POST = createApiHandler<LinkServicesInput, Awaited<ReturnType<typeof linkServices>>>({
  schema: linkServicesSchema,
  authHook: requireAdmin,
  handler: async ({ parsedBody, request }) => {
    const offerId = extractOfferIdFromUrl(request.url);
    return linkServices(offerId, parsedBody.serviceIds);
  },
  successMessage: "सेवाएँ सफलतापूर्वक जोड़ी गईं। / Services linked successfully.",
  successStatus: 201,
});
