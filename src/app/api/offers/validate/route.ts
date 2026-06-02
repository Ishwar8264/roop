/**
 * Purpose: Validate promo code API endpoint
 * Responsibility: Validate a promo code and calculate discount amount (public)
 *
 * Endpoint:
 *   POST /api/offers/validate — Validate promo code and return discount info
 *
 * POST Request Body:
 *   code        (required) — Promo code to validate
 *   orderAmount (optional) — Order amount for minOrder check (decimal string)
 *
 * Validation Logic:
 *   1. Check offer exists by code
 *   2. Check isActive
 *   3. Check validFrom <= now <= validUntil
 *   4. Check usageCount < usageLimit (if usageLimit set)
 *   5. Check minOrder (if provided in request)
 *   6. Calculate discount amount (percentage or flat)
 *   7. Apply maxDiscount cap
 *
 * Response:
 *   200: { success: true, data: { valid, offer, discountAmount, maxDiscount } }
 *   - valid: boolean — whether the promo code is valid
 *   - offer: object | null — offer details if found
 *   - discountAmount: string | null — calculated discount amount
 *   - maxDiscount: string | null — max discount cap
 *   - reason: string | null — reason if invalid
 */

import { createApiHandler } from "@/lib/api-handler";
import { prisma } from "@/lib/prisma";
import { validateOfferSchema } from "@/lib/validations/offers";

// ==================== POST — Validate Promo Code (Public) ====================

export const POST = createApiHandler({
  schema: validateOfferSchema,
  handler: async ({ parsedBody }) => {
    const { code, orderAmount } = parsedBody;

    // 1. Find offer by code (case-insensitive lookup)
    const offer = await prisma.offer.findUnique({
      where: { code: code.toUpperCase() },
      include: {
        offerServices: {
          select: { serviceId: true },
        },
      },
    });

    // 2. Check offer exists
    if (!offer) {
      return {
        valid: false,
        offer: null,
        discountAmount: null,
        maxDiscount: null,
        reason: "Invalid promo code",
      };
    }

    // 3. Check isActive
    if (!offer.isActive) {
      return {
        valid: false,
        offer: {
          id: offer.id,
          code: offer.code,
          titleHi: offer.titleHi,
          titleEn: offer.titleEn,
          discountType: offer.discountType,
          discountValue: offer.discountValue.toString(),
          minOrder: offer.minOrder?.toString() ?? null,
          maxDiscount: offer.maxDiscount?.toString() ?? null,
          validFrom: offer.validFrom,
          validUntil: offer.validUntil,
          usageLimit: offer.usageLimit,
          usageCount: offer.usageCount,
          serviceIds: offer.offerServices.map((os) => os.serviceId),
        },
        discountAmount: null,
        maxDiscount: offer.maxDiscount?.toString() ?? null,
        reason: "This promo code is no longer active",
      };
    }

    // 4. Check date validity
    const now = new Date();
    if (now < offer.validFrom) {
      return {
        valid: false,
        offer: {
          id: offer.id,
          code: offer.code,
          titleHi: offer.titleHi,
          titleEn: offer.titleEn,
          discountType: offer.discountType,
          discountValue: offer.discountValue.toString(),
          minOrder: offer.minOrder?.toString() ?? null,
          maxDiscount: offer.maxDiscount?.toString() ?? null,
          validFrom: offer.validFrom,
          validUntil: offer.validUntil,
          usageLimit: offer.usageLimit,
          usageCount: offer.usageCount,
          serviceIds: offer.offerServices.map((os) => os.serviceId),
        },
        discountAmount: null,
        maxDiscount: offer.maxDiscount?.toString() ?? null,
        reason: "This promo code is not yet active",
      };
    }

    if (now > offer.validUntil) {
      return {
        valid: false,
        offer: {
          id: offer.id,
          code: offer.code,
          titleHi: offer.titleHi,
          titleEn: offer.titleEn,
          discountType: offer.discountType,
          discountValue: offer.discountValue.toString(),
          minOrder: offer.minOrder?.toString() ?? null,
          maxDiscount: offer.maxDiscount?.toString() ?? null,
          validFrom: offer.validFrom,
          validUntil: offer.validUntil,
          usageLimit: offer.usageLimit,
          usageCount: offer.usageCount,
          serviceIds: offer.offerServices.map((os) => os.serviceId),
        },
        discountAmount: null,
        maxDiscount: offer.maxDiscount?.toString() ?? null,
        reason: "This promo code has expired",
      };
    }

    // 5. Check usage limit
    if (offer.usageLimit !== null && offer.usageCount >= offer.usageLimit) {
      return {
        valid: false,
        offer: {
          id: offer.id,
          code: offer.code,
          titleHi: offer.titleHi,
          titleEn: offer.titleEn,
          discountType: offer.discountType,
          discountValue: offer.discountValue.toString(),
          minOrder: offer.minOrder?.toString() ?? null,
          maxDiscount: offer.maxDiscount?.toString() ?? null,
          validFrom: offer.validFrom,
          validUntil: offer.validUntil,
          usageLimit: offer.usageLimit,
          usageCount: offer.usageCount,
          serviceIds: offer.offerServices.map((os) => os.serviceId),
        },
        discountAmount: null,
        maxDiscount: offer.maxDiscount?.toString() ?? null,
        reason: "This promo code has reached its usage limit",
      };
    }

    // 6. Check minOrder if provided
    if (orderAmount && offer.minOrder) {
      const orderAmt = parseFloat(orderAmount);
      const minOrd = parseFloat(offer.minOrder.toString());
      if (orderAmt < minOrd) {
        return {
          valid: false,
          offer: {
            id: offer.id,
            code: offer.code,
            titleHi: offer.titleHi,
            titleEn: offer.titleEn,
            discountType: offer.discountType,
            discountValue: offer.discountValue.toString(),
            minOrder: offer.minOrder?.toString() ?? null,
            maxDiscount: offer.maxDiscount?.toString() ?? null,
            validFrom: offer.validFrom,
            validUntil: offer.validUntil,
            usageLimit: offer.usageLimit,
            usageCount: offer.usageCount,
            serviceIds: offer.offerServices.map((os) => os.serviceId),
          },
          discountAmount: null,
          maxDiscount: offer.maxDiscount?.toString() ?? null,
          reason: `Minimum order amount is ₹${offer.minOrder.toString()}`,
        };
      }
    }

    // 7. Calculate discount amount
    let discountAmount = 0;
    const discountValue = parseFloat(offer.discountValue.toString());

    if (offer.discountType === "PERCENTAGE") {
      if (orderAmount) {
        discountAmount = (parseFloat(orderAmount) * discountValue) / 100;
      } else {
        // Without order amount, can't calculate percentage discount exactly
        discountAmount = 0;
      }
    } else {
      // FLAT_AMOUNT
      discountAmount = discountValue;
    }

    // 8. Apply maxDiscount cap
    if (offer.maxDiscount) {
      const maxDisc = parseFloat(offer.maxDiscount.toString());
      if (discountAmount > maxDisc) {
        discountAmount = maxDisc;
      }
    }

    // 9. Return valid offer with discount calculation
    return {
      valid: true,
      offer: {
        id: offer.id,
        code: offer.code,
        titleHi: offer.titleHi,
        titleEn: offer.titleEn,
        discountType: offer.discountType,
        discountValue: offer.discountValue.toString(),
        minOrder: offer.minOrder?.toString() ?? null,
        maxDiscount: offer.maxDiscount?.toString() ?? null,
        validFrom: offer.validFrom,
        validUntil: offer.validUntil,
        usageLimit: offer.usageLimit,
        usageCount: offer.usageCount,
        serviceIds: offer.offerServices.map((os) => os.serviceId),
      },
      discountAmount: discountAmount.toFixed(2),
      maxDiscount: offer.maxDiscount?.toString() ?? null,
      reason: null,
    };
  },
});
