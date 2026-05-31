/**
 * Purpose: Zod validation schemas for Portfolio & Media API routes
 * Responsibility: Validate all portfolio and media API inputs using shared primitives
 * Important Notes:
 *   - Uses common schemas from validations/common.ts
 *   - One schema per API endpoint
 *   - Export both schema and inferred type
 *   - PortfolioItem model uses titleHi/titleEn (not captionHi/captionEn)
 */

import { z } from "zod";
import { cuid, nonEmptyString, pageParam, pageSizeParam } from "../common";

// ==================== ADD PORTFOLIO ITEM ====================

/** POST /api/staff/[id]/portfolio */
export const addPortfolioItemSchema = z.object({
  imageUrl: z.string().url("Must be a valid URL"),
  titleHi: nonEmptyString.optional(),
  titleEn: nonEmptyString.optional(),
  isFeatured: z.boolean().default(false),
});

export type AddPortfolioItemInput = z.infer<typeof addPortfolioItemSchema>;

// ==================== LIST PORTFOLIO QUERY ====================

/** GET /api/portfolio — query params */
export const listPortfolioQuerySchema = z.object({
  staffId: cuid.optional(),
  page: pageParam,
  pageSize: pageSizeParam,
});

export type ListPortfolioQueryInput = z.infer<typeof listPortfolioQuerySchema>;

// ==================== SAVE MEDIA URL ====================

/** POST /api/media — save media URL record */
export const saveMediaSchema = z.object({
  url: z.string().url("Must be a valid URL"),
  ownerId: cuid,
  ownerType: z.enum([
    "SERVICE",
    "STAFF",
    "PORTFOLIO",
    "BRANCH",
    "BLOG",
    "PRODUCT",
    "OFFER",
  ]),
  altHi: nonEmptyString.optional(),
  altEn: nonEmptyString.optional(),
  mimeType: z.string().optional(),
  fileSize: z.number().int().positive().optional(),
  sortOrder: z.number().int().min(0).default(0),
});

export type SaveMediaInput = z.infer<typeof saveMediaSchema>;
