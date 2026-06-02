/**
 * Purpose: Zod validation schemas for offer API routes
 * Responsibility: Validate all offer, service assignment, and validation API inputs
 * Important Notes:
 *   - One schema per API endpoint
 *   - Export both schema and inferred type
 *   - Hindi-first error messages
 *   - Offer code: uppercase letters + numbers only, 3-20 chars
 *   - Discount validation: PERCENTAGE → 1-100, FLAT_AMOUNT → > 0
 *   - Date validation: validFrom must be before validUntil
 *   - Code immutability enforced at service layer (not schema)
 */

import { z } from "zod";

// ==================== SHARED PRIMITIVES ====================

/** Offer code — uppercase letters + numbers only, 3-20 chars */
export const offerCode = z
  .string()
  .regex(/^[A-Z0-9]{3,20}$/, "ऑफर कोड 3-20 अक्षरों का होना चाहिए (केवल बड़े अक्षर और संख्या) / Offer code must be 3-20 characters (uppercase letters and numbers only)")
  .transform((val) => val.toUpperCase());

/** Discount type enum */
export const discountTypeSchema = z.enum(
  ["PERCENTAGE", "FLAT_AMOUNT"],
  { message: "डिस्काउंट प्रकार PERCENTAGE या FLAT_AMOUNT होना चाहिए / Discount type must be PERCENTAGE or FLAT_AMOUNT" }
);

/** Positive number for monetary values */
const positiveAmount = z
  .number()
  .positive("राशि शून्य से अधिक होनी चाहिए / Amount must be greater than zero");

/** Non-negative number for optional monetary fields */
const nonNegativeAmount = z
  .number()
  .min(0, "राशि शून्य या अधिक होनी चाहिए / Amount must be zero or greater");

// ==================== CREATE OFFER ====================

/** Body for POST /api/offers */
export const createOfferSchema = z
  .object({
    code: offerCode,
    titleHi: z
      .string()
      .min(1, "ऑफर शीर्षक हिंदी में आवश्यक है / Offer title in Hindi is required")
      .max(200, "शीर्षक 200 अक्षरों से कम होना चाहिए / Title must be under 200 characters")
      .trim(),
    titleEn: z
      .string()
      .max(200, "Title must be under 200 characters")
      .trim()
      .optional(),
    descriptionHi: z
      .string()
      .max(2000, "विवरण 2000 अक्षरों से कम होना चाहिए / Description must be under 2000 characters")
      .trim()
      .optional(),
    descriptionEn: z
      .string()
      .max(2000, "Description must be under 2000 characters")
      .trim()
      .optional(),
    discountType: discountTypeSchema,
    discountValue: positiveAmount,
    minOrder: nonNegativeAmount.optional(),
    maxDiscount: positiveAmount.optional(),
    validFrom: z
      .string()
      .min(1, "प्रारंभ तारीख आवश्यक है / Valid from date is required")
      .refine((val) => !isNaN(Date.parse(val)), { message: "अमान्य तारीख / Invalid date" }),
    validUntil: z
      .string()
      .min(1, "समाप्ति तारीख आवश्यक है / Valid until date is required")
      .refine((val) => !isNaN(Date.parse(val)), { message: "अमान्य तारीख / Invalid date" }),
    usageLimit: z
      .number()
      .int("उपयोग सीमा पूर्णांक होनी चाहिए / Usage limit must be an integer")
      .positive("उपयोग सीमा 0 से अधिक होनी चाहिए / Usage limit must be greater than 0")
      .optional(),
    serviceIds: z
      .array(z.string().min(1, "सेवा ID आवश्यक है / Service ID is required"))
      .optional(),
  })
  .refine(
    (data) => {
      // PERCENTAGE discountValue must be 1-100
      if (data.discountType === "PERCENTAGE" && (data.discountValue < 1 || data.discountValue > 100)) {
        return false;
      }
      return true;
    },
    { message: "प्रतिशत डिस्काउंट 1-100 के बीच होना चाहिए / Percentage discount must be between 1 and 100", path: ["discountValue"] }
  )
  .refine(
    (data) => new Date(data.validFrom) < new Date(data.validUntil),
    { message: "प्रारंभ तारीख समाप्ति तारीख से पहले होनी चाहिए / Valid from must be before valid until", path: ["validFrom"] }
  );

export type CreateOfferInput = z.infer<typeof createOfferSchema>;

// ==================== UPDATE OFFER ====================

/** Body for PATCH /api/offers/[id] */
export const updateOfferSchema = z
  .object({
    code: z.never().optional(), // Code is immutable — will be rejected at service layer
    titleHi: z
      .string()
      .min(1, "ऑफर शीर्षक हिंदी में आवश्यक है / Offer title in Hindi is required")
      .max(200, "शीर्षक 200 अक्षरों से कम होना चाहिए / Title must be under 200 characters")
      .trim()
      .optional(),
    titleEn: z
      .string()
      .max(200, "Title must be under 200 characters")
      .trim()
      .nullable()
      .optional(),
    descriptionHi: z
      .string()
      .max(2000, "विवरण 2000 अक्षरों से कम होना चाहिए / Description must be under 2000 characters")
      .trim()
      .nullable()
      .optional(),
    descriptionEn: z
      .string()
      .max(2000, "Description must be under 2000 characters")
      .trim()
      .nullable()
      .optional(),
    discountType: discountTypeSchema.optional(),
    discountValue: positiveAmount.optional(),
    minOrder: nonNegativeAmount.nullable().optional(),
    maxDiscount: positiveAmount.nullable().optional(),
    validFrom: z
      .string()
      .refine((val) => !isNaN(Date.parse(val)), { message: "अमान्य तारीख / Invalid date" })
      .optional(),
    validUntil: z
      .string()
      .refine((val) => !isNaN(Date.parse(val)), { message: "अमान्य तारीख / Invalid date" })
      .optional(),
    usageLimit: z
      .number()
      .int("उपयोग सीमा पूर्णांक होनी चाहिए / Usage limit must be an integer")
      .positive("उपयोग सीमा 0 से अधिक होनी चाहिए / Usage limit must be greater than 0")
      .nullable()
      .optional(),
    isActive: z.boolean().optional(),
  })
  .refine(
    (data) => {
      // If discountType is PERCENTAGE and discountValue is provided, must be 1-100
      if (data.discountType === "PERCENTAGE" && data.discountValue !== undefined && (data.discountValue < 1 || data.discountValue > 100)) {
        return false;
      }
      return true;
    },
    { message: "प्रतिशत डिस्काउंट 1-100 के बीच होना चाहिए / Percentage discount must be between 1 and 100", path: ["discountValue"] }
  )
  .refine(
    (data) => {
      // Only validate dates if both are provided
      if (data.validFrom && data.validUntil) {
        return new Date(data.validFrom) < new Date(data.validUntil);
      }
      return true;
    },
    { message: "प्रारंभ तारीख समाप्ति तारीख से पहले होनी चाहिए / Valid from must be before valid until", path: ["validFrom"] }
  );

export type UpdateOfferInput = z.infer<typeof updateOfferSchema>;

// ==================== LINK SERVICES ====================

/** Body for POST /api/offers/[id]/services — bulk link */
export const linkServicesSchema = z.object({
  serviceIds: z
    .array(z.string().min(1, "सेवा ID आवश्यक है / Service ID is required"))
    .min(1, "कम से कम एक सेवा ID आवश्यक है / At least one service ID is required"),
});

export type LinkServicesInput = z.infer<typeof linkServicesSchema>;

// ==================== VALIDATE OFFER ====================

/** Body for POST /api/offers/validate */
export const validateOfferSchema = z.object({
  code: z
    .string()
    .min(1, "ऑफर कोड आवश्यक है / Offer code is required")
    .trim(),
  serviceId: z
    .string()
    .min(1, "सेवा ID आवश्यक है / Service ID is required"),
  bookingAmount: z
    .number()
    .positive("बुकिंग राशि शून्य से अधिक होनी चाहिए / Booking amount must be greater than zero"),
});

export type ValidateOfferInput = z.infer<typeof validateOfferSchema>;
