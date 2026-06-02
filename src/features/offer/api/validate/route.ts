/**
 * Purpose: Validate promo code endpoint
 * Endpoint: POST /api/offers/validate — Validate promo code (Authenticated)
 * Full validation chain: exists → active → dates → usage → minOrder → service applicable → calculate discount
 */

import { createApiHandler } from "@/lib/server/api-handler";
import { validateOfferSchema } from "@/features/offer/validations/offer";
import {
  validateOfferCode,
  requireAuth,
} from "@/features/offer/services/offer-service";
import type { ValidateOfferInput } from "@/features/offer/validations/offer";

export const POST = createApiHandler<ValidateOfferInput, Awaited<ReturnType<typeof validateOfferCode>>>({
  schema: validateOfferSchema,
  authHook: requireAuth,
  handler: async ({ parsedBody, auth }) => {
    const userId = auth!.payload.userId;
    return validateOfferCode(parsedBody.code, parsedBody.serviceId, parsedBody.bookingAmount, userId);
  },
  successMessage: "ऑफर सफलतापूर्वक सत्यापित हुआ। / Offer validated successfully.",
});
