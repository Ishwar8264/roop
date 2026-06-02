/**
 * Purpose: Offer feature types — shared across service, routes, and client
 * Responsibility: Type definitions for offer CRUD, service assignment, and validation APIs
 * Important Notes:
 *   - These are API response types — never expose raw Prisma models
 *   - All monetary values returned as numbers (converted from Prisma Decimal)
 *   - DiscountType mirrors Prisma enum: PERCENTAGE | FLAT_AMOUNT
 *   - Date fields returned as ISO strings for frontend convenience
 */

// ==================== DISCOUNT TYPE ====================

/** Discount type — mirrors Prisma DiscountType enum */
export type DiscountType = "PERCENTAGE" | "FLAT_AMOUNT";

// ==================== OFFER RESPONSE ====================

/** Offer data returned in list API responses */
export interface OfferResponse {
  id: string;
  code: string;
  titleHi: string;
  titleEn: string | null;
  descriptionHi: string | null;
  descriptionEn: string | null;
  discountType: DiscountType;
  discountValue: number;
  minOrder: number | null;
  maxDiscount: number | null;
  validFrom: string; // ISO string
  validUntil: string; // ISO string
  usageLimit: number | null;
  usageCount: number;
  isActive: boolean;
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
}

/** Offer detail response — includes linked services */
export interface OfferDetailResponse extends OfferResponse {
  services: OfferServiceItemResponse[];
}

/** Paginated offer list response */
export interface OfferListResponse {
  offers: OfferResponse[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ==================== OFFER SERVICE ====================

/** Service info within offer service assignment */
export interface OfferServiceItemResponse {
  id: string; // OfferService id
  serviceId: string;
  nameHi: string;
  nameEn: string;
  price: number;
  durationMinutes: number;
}

/** Bulk link services result */
export interface BulkLinkServicesResult {
  linked: number;
  skipped: number;
  total: number;
}

// ==================== OFFER VALIDATION ====================

/** Offer validation result — returned by POST /api/offers/validate */
export interface OfferValidationResponse {
  isApplicable: boolean;
  offer: {
    id: string;
    code: string;
    titleHi: string;
    titleEn: string | null;
    discountType: DiscountType;
    discountValue: number;
    minOrder: number | null;
    maxDiscount: number | null;
    validFrom: string;
    validUntil: string;
    usageLimit: number | null;
    usageCount: number;
  };
  discountAmount: number;
  finalAmount: number;
}

// ==================== QUERY / FILTER TYPES ====================

/** Query params for GET /api/offers */
export interface OfferListQuery {
  isActive?: boolean;
  includeExpired?: boolean;
  page?: number;
  limit?: number;
}
