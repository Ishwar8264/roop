/**
 * Purpose: Zod validation schemas for service catalog API routes
 * Responsibility: Validate all service, category, variant, and add-on API inputs
 * Important Notes:
 *   - One schema per API endpoint
 *   - Export both schema and inferred type
 *   - Hindi-first error messages
 *   - Slug format: kebab-case (lowercase, hyphens, no spaces)
 *   - Price: positive number, max 10 digits with 2 decimal places
 */

import { z } from "zod";

// ==================== SHARED PRIMITIVES ====================

/** Slug — kebab-case, URL-safe identifier */
export const slug = z
  .string()
  .min(1, "Slug आवश्यक है / Slug is required")
  .max(100, "Slug 100 अक्षरों से कम होना चाहिए / Slug must be under 100 characters")
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug केवल लोअरकेस अक्षर, अंक और हाइफन हो सकते हैं / Slug must be lowercase letters, digits, and hyphens only")
  .trim();

/** Price — positive number for Decimal(10,2) */
export const price = z
  .number()
  .positive("कीमत शून्य से अधिक होनी चाहिए / Price must be greater than zero")
  .max(99999999.99, "कीमत अधिकतम ₹9,99,99,999.99 हो सकती है / Price must be under ₹9,99,99,999.99");

/** Duration in minutes — positive integer */
export const durationMinutes = z
  .number()
  .int("अवधि पूर्णांक होनी चाहिए / Duration must be an integer")
  .positive("अवधि शून्य से अधिक होनी चाहिए / Duration must be greater than zero")
  .max(600, "अवधि अधिकतम 600 मिनट हो सकती है / Duration must be at most 600 minutes");

// ==================== SERVICE CATEGORY ====================

/** POST /api/service-categories */
export const createServiceCategorySchema = z.object({
  nameHi: z
    .string()
    .min(1, "श्रेणी का नाम (हिंदी) आवश्यक है / Category name (Hindi) is required")
    .max(200, "नाम 200 अक्षरों से कम होना चाहिए / Name must be under 200 characters")
    .trim(),
  nameEn: z
    .string()
    .min(1, "Category name (English) is required")
    .max(200, "Name must be under 200 characters")
    .trim(),
  slug,
  icon: z
    .string()
    .max(50, "Icon 50 अक्षरों से कम होना चाहिए / Icon must be under 50 characters")
    .trim()
    .nullable()
    .optional(),
  sortOrder: z
    .number()
    .int("क्रम पूर्णांक होना चाहिए / Sort order must be an integer")
    .min(0, "क्रम 0 या अधिक होना चाहिए / Sort order must be 0 or greater")
    .optional(),
});

export type CreateServiceCategoryInput = z.infer<typeof createServiceCategorySchema>;

/** PATCH /api/service-categories/[id] */
export const updateServiceCategorySchema = z.object({
  nameHi: z
    .string()
    .min(1, "श्रेणी का नाम (हिंदी) आवश्यक है / Category name (Hindi) is required")
    .max(200, "नाम 200 अक्षरों से कम होना चाहिए / Name must be under 200 characters")
    .trim()
    .optional(),
  nameEn: z
    .string()
    .min(1, "Category name (English) is required")
    .max(200, "Name must be under 200 characters")
    .trim()
    .optional(),
  slug: slug.optional(),
  icon: z
    .string()
    .max(50, "Icon 50 अक्षरों से कम होना चाहिए / Icon must be under 50 characters")
    .trim()
    .nullable()
    .optional(),
  sortOrder: z
    .number()
    .int("क्रम पूर्णांक होना चाहिए / Sort order must be an integer")
    .min(0, "क्रम 0 या अधिक होना चाहिए / Sort order must be 0 or greater")
    .optional(),
});

export type UpdateServiceCategoryInput = z.infer<typeof updateServiceCategorySchema>;

// ==================== SERVICE ====================

/** POST /api/services */
export const createServiceSchema = z.object({
  nameHi: z
    .string()
    .min(1, "सेवा का नाम (हिंदी) आवश्यक है / Service name (Hindi) is required")
    .max(200, "नाम 200 अक्षरों से कम होना चाहिए / Name must be under 200 characters")
    .trim(),
  nameEn: z
    .string()
    .min(1, "Service name (English) is required")
    .max(200, "Name must be under 200 characters")
    .trim(),
  slug,
  descriptionHi: z
    .string()
    .min(1, "विवरण (हिंदी) आवश्यक है / Description (Hindi) is required")
    .max(2000, "विवरण 2000 अक्षरों से कम होना चाहिए / Description must be under 2000 characters")
    .trim(),
  descriptionEn: z
    .string()
    .max(2000, "Description must be under 2000 characters")
    .trim()
    .optional(),
  descriptionHtml: z
    .string()
    .max(50000, "HTML विवरण बहुत लंबा है / HTML description is too long")
    .optional(),
  price,
  durationMinutes,
  imageUrl: z
    .string()
    .url("अमान्य URL / Invalid URL")
    .nullable()
    .optional(),
  branchId: z
    .string()
    .min(1, "शाखा आवश्यक है / Branch ID is required"),
  categoryId: z
    .string()
    .min(1, "श्रेणी आवश्यक है / Category ID is required"),
});

export type CreateServiceInput = z.infer<typeof createServiceSchema>;

/** PATCH /api/services/[id] */
export const updateServiceSchema = z.object({
  nameHi: z
    .string()
    .min(1, "सेवा का नाम (हिंदी) आवश्यक है / Service name (Hindi) is required")
    .max(200, "नाम 200 अक्षरों से कम होना चाहिए / Name must be under 200 characters")
    .trim()
    .optional(),
  nameEn: z
    .string()
    .min(1, "Service name (English) is required")
    .max(200, "Name must be under 200 characters")
    .trim()
    .optional(),
  slug: slug.optional(),
  descriptionHi: z
    .string()
    .min(1, "विवरण (हिंदी) आवश्यक है / Description (Hindi) is required")
    .max(2000, "विवरण 2000 अक्षरों से कम होना चाहिए / Description must be under 2000 characters")
    .trim()
    .optional(),
  descriptionEn: z
    .string()
    .max(2000, "Description must be under 2000 characters")
    .trim()
    .optional(),
  descriptionHtml: z
    .string()
    .max(50000, "HTML विवरण बहुत लंबा है / HTML description is too long")
    .optional(),
  price: price.optional(),
  durationMinutes: durationMinutes.optional(),
  imageUrl: z
    .string()
    .url("अमान्य URL / Invalid URL")
    .nullable()
    .optional(),
  branchId: z
    .string()
    .min(1, "शाखा आवश्यक है / Branch ID is required")
    .optional(),
  categoryId: z
    .string()
    .min(1, "श्रेणी आवश्यक है / Category ID is required")
    .optional(),
});

export type UpdateServiceInput = z.infer<typeof updateServiceSchema>;

// ==================== SERVICE VARIANT ====================

/** POST /api/services/[id]/variants */
export const createServiceVariantSchema = z.object({
  nameHi: z
    .string()
    .min(1, "वेरिएंट का नाम (हिंदी) आवश्यक है / Variant name (Hindi) is required")
    .max(200, "नाम 200 अक्षरों से कम होना चाहिए / Name must be under 200 characters")
    .trim(),
  nameEn: z
    .string()
    .min(1, "Variant name (English) is required")
    .max(200, "Name must be under 200 characters")
    .trim(),
  price,
  durationMinutes,
  sortOrder: z
    .number()
    .int("क्रम पूर्णांक होना चाहिए / Sort order must be an integer")
    .min(0, "क्रम 0 या अधिक होना चाहिए / Sort order must be 0 or greater")
    .optional(),
});

export type CreateServiceVariantInput = z.infer<typeof createServiceVariantSchema>;

/** PATCH /api/services/[id]/variants/[variantId] */
export const updateServiceVariantSchema = z.object({
  nameHi: z
    .string()
    .min(1, "वेरिएंट का नाम (हिंदी) आवश्यक है / Variant name (Hindi) is required")
    .max(200, "नाम 200 अक्षरों से कम होना चाहिए / Name must be under 200 characters")
    .trim()
    .optional(),
  nameEn: z
    .string()
    .min(1, "Variant name (English) is required")
    .max(200, "Name must be under 200 characters")
    .trim()
    .optional(),
  price: price.optional(),
  durationMinutes: durationMinutes.optional(),
  sortOrder: z
    .number()
    .int("क्रम पूर्णांक होना चाहिए / Sort order must be an integer")
    .min(0, "क्रम 0 या अधिक होना चाहिए / Sort order must be 0 or greater")
    .optional(),
});

export type UpdateServiceVariantInput = z.infer<typeof updateServiceVariantSchema>;

// ==================== SERVICE ADD-ON ====================

/** POST /api/services/[id]/add-ons */
export const createServiceAddOnSchema = z.object({
  nameHi: z
    .string()
    .min(1, "ऐड-ऑन का नाम (हिंदी) आवश्यक है / Add-on name (Hindi) is required")
    .max(200, "नाम 200 अक्षरों से कम होना चाहिए / Name must be under 200 characters")
    .trim(),
  nameEn: z
    .string()
    .min(1, "Add-on name (English) is required")
    .max(200, "Name must be under 200 characters")
    .trim(),
  price,
  durationMinutes,
});

export type CreateServiceAddOnInput = z.infer<typeof createServiceAddOnSchema>;

/** PATCH /api/services/[id]/add-ons/[addOnId] */
export const updateServiceAddOnSchema = z.object({
  nameHi: z
    .string()
    .min(1, "ऐड-ऑन का नाम (हिंदी) आवश्यक है / Add-on name (Hindi) is required")
    .max(200, "नाम 200 अक्षरों से कम होना चाहिए / Name must be under 200 characters")
    .trim()
    .optional(),
  nameEn: z
    .string()
    .min(1, "Add-on name (English) is required")
    .max(200, "Name must be under 200 characters")
    .trim()
    .optional(),
  price: price.optional(),
  durationMinutes: durationMinutes.optional(),
});

export type UpdateServiceAddOnInput = z.infer<typeof updateServiceAddOnSchema>;
