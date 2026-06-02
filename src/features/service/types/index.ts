/**
 * Purpose: Service feature types — shared across service, routes, and client
 * Responsibility: Type definitions for service catalog APIs
 * Important Notes:
 *   - These are API response types — never expose raw Prisma models
 *   - Decimal fields (price) returned as numbers for frontend convenience
 *   - Date fields returned as ISO strings
 */

// ==================== SERVICE CATEGORY ====================

/** Service category data returned in API responses */
export interface ServiceCategoryResponse {
  id: string;
  nameHi: string;
  nameEn: string;
  slug: string;
  icon: string | null;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/** Paginated service category list response */
export interface ServiceCategoryListResponse {
  categories: ServiceCategoryResponse[];
  total: number;
}

// ==================== SERVICE ====================

/** Service data returned in list API responses */
export interface ServiceResponse {
  id: string;
  nameHi: string;
  nameEn: string;
  slug: string;
  descriptionHi: string;
  descriptionEn: string | null;
  descriptionHtml: string | null;
  price: number;
  durationMinutes: number;
  imageUrl: string | null;
  isActive: boolean;
  branchId: string;
  categoryId: string;
  categoryNameHi: string;
  categoryNameEn: string;
  variantCount: number;
  createdAt: string;
  updatedAt: string;
}

/** Service detail response — includes category, variants, addOns */
export interface ServiceDetailResponse extends Omit<ServiceResponse, 'categoryNameHi' | 'categoryNameEn' | 'variantCount'> {
  category: ServiceCategoryResponse;
  variants: ServiceVariantResponse[];
  addOns: ServiceAddOnResponse[];
}

/** Paginated service list response */
export interface ServiceListResponse {
  services: ServiceResponse[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ==================== SERVICE VARIANT ====================

/** Service variant data returned in API responses */
export interface ServiceVariantResponse {
  id: string;
  serviceId: string;
  nameHi: string;
  nameEn: string;
  price: number;
  durationMinutes: number;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

// ==================== SERVICE ADD-ON ====================

/** Service add-on data returned in API responses */
export interface ServiceAddOnResponse {
  id: string;
  serviceId: string;
  nameHi: string;
  nameEn: string;
  price: number;
  durationMinutes: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// ==================== QUERY / FILTER TYPES ====================

/** Query params for GET /api/services */
export interface ServiceListQuery {
  branchId?: string;
  categoryId?: string;
  includeInactive?: boolean;
  page?: number;
  limit?: number;
}

/** Query params for GET /api/service-categories */
export interface ServiceCategoryListQuery {
  includeInactive?: boolean;
}
