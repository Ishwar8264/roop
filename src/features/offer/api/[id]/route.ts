/**
 * Purpose: Offer detail, update, and deactivate endpoints
 * Endpoints:
 *   GET   /api/offers/[id]  — Get offer detail with linked services (Public)
 *   PATCH /api/offers/[id]  — Update offer (ADMIN only)
 *   DELETE /api/offers/[id] — Soft delete / deactivate offer (ADMIN only)
 */

import { createApiHandler } from "@/lib/server/api-handler";
import { updateOfferSchema } from "@/features/offer/validations/offer";
import {
  getOfferById,
  updateOffer,
  deactivateOffer,
  requireAdmin,
  extractOfferIdFromUrl,
} from "@/features/offer/services/offer-service";
import type { UpdateOfferInput } from "@/features/offer/validations/offer";

// ==================== GET — OFFER DETAIL (PUBLIC) ====================

export const GET = createApiHandler<null, Awaited<ReturnType<typeof getOfferById>>>({
  schema: null,
  handler: async ({ request }) => {
    const offerId = extractOfferIdFromUrl(request.url);
    return getOfferById(offerId);
  },
  successMessage: "ऑफर विवरण सफलतापूर्वक प्राप्त हुआ। / Offer detail fetched successfully.",
});

// ==================== PATCH — UPDATE OFFER (ADMIN ONLY) ====================

export const PATCH = createApiHandler<UpdateOfferInput, Awaited<ReturnType<typeof updateOffer>>>({
  schema: updateOfferSchema,
  authHook: requireAdmin,
  handler: async ({ parsedBody, request }) => {
    const offerId = extractOfferIdFromUrl(request.url);
    return updateOffer(offerId, parsedBody);
  },
  successMessage: "ऑफर सफलतापूर्वक अपडेट किया गया। / Offer updated successfully.",
});

// ==================== DELETE — DEACTIVATE OFFER (ADMIN ONLY) ====================

export const DELETE = createApiHandler<null, Awaited<ReturnType<typeof deactivateOffer>>>({
  schema: null,
  authHook: requireAdmin,
  handler: async ({ request }) => {
    const offerId = extractOfferIdFromUrl(request.url);
    return deactivateOffer(offerId);
  },
  successMessage: "ऑफर सफलतापूर्वक निष्क्रिय किया गया। / Offer deactivated successfully.",
});
