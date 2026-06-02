/**
 * Purpose: Offer list + create endpoints
 * Endpoints:
 *   GET  /api/offers  — List offers (Public for active, Admin for all)
 *   POST /api/offers  — Create offer (ADMIN only)
 */

import { createApiHandler } from "@/lib/server/api-handler";
import { createOfferSchema } from "@/features/offer/validations/offer";
import {
  listOffers,
  createOffer,
  requireAdmin,
} from "@/features/offer/services/offer-service";
import type { CreateOfferInput } from "@/features/offer/validations/offer";

// ==================== GET — LIST OFFERS (PUBLIC + ADMIN) ====================

export const GET = createApiHandler<null, Awaited<ReturnType<typeof listOffers>>>({
  schema: null,
  handler: async ({ request, auth }) => {
    const url = new URL(request.url);
    const isAdmin = auth?.user?.role === "ADMIN";

    const isActiveParam = url.searchParams.get("isActive");
    const includeExpired = url.searchParams.get("includeExpired") === "true";
    const page = parseInt(url.searchParams.get("page") || "1", 10);
    const limit = parseInt(url.searchParams.get("limit") || "20", 10);

    // Validate pagination params
    const validPage = Math.max(1, isNaN(page) ? 1 : page);
    const validLimit = Math.min(100, Math.max(1, isNaN(limit) ? 20 : limit));

    // Parse isActive filter (only applicable for admin)
    let isActive: boolean | undefined;
    if (isAdmin && isActiveParam !== null) {
      isActive = isActiveParam === "true";
    }

    return listOffers({
      isActive,
      includeExpired: isAdmin ? includeExpired : false,
      page: validPage,
      limit: validLimit,
    }, isAdmin);
  },
  successMessage: "ऑफर सफलतापूर्वक प्राप्त हुए। / Offers fetched successfully.",
});

// ==================== POST — CREATE OFFER (ADMIN ONLY) ====================

export const POST = createApiHandler<CreateOfferInput, Awaited<ReturnType<typeof createOffer>>>({
  schema: createOfferSchema,
  authHook: requireAdmin,
  handler: async ({ parsedBody }) => {
    return createOffer(parsedBody);
  },
  successMessage: "ऑफर सफलतापूर्वक बनाया गया। / Offer created successfully.",
  successStatus: 201,
});
