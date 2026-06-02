/**
 * Purpose: Branch feature types — shared across service, routes, and client
 * Responsibility: Type definitions for branch and branch holiday APIs
 * Important Notes:
 *   - These are API response types — never expose raw Prisma models
 *   - Time fields returned as "HH:mm" strings for frontend convenience
 *   - Date fields returned as ISO strings
 */

// ==================== BRANCH ====================

/** Branch data returned in API responses */
export interface BranchResponse {
  id: string;
  nameHi: string;
  nameEn: string;
  city: string;
  address: string;
  googleMapsUrl: string | null;
  phone: string;
  openTime: string; // "09:00"
  closeTime: string; // "20:00"
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/** Branch detail response — includes holidays for current + next month */
export interface BranchDetailResponse extends BranchResponse {
  holidays: BranchHolidayResponse[];
}

/** Paginated branch list response */
export interface BranchListResponse {
  branches: BranchResponse[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ==================== BRANCH HOLIDAY ====================

/** Branch holiday data returned in API responses */
export interface BranchHolidayResponse {
  id: string;
  branchId: string;
  date: string; // "2026-05-15"
  reasonHi: string;
  reasonEn: string | null;
  createdAt: string;
}

// ==================== QUERY / FILTER TYPES ====================

/** Query params for GET /api/branches */
export interface BranchListQuery {
  city?: string;
  includeInactive?: boolean;
  page?: number;
  limit?: number;
}

/** Query params for GET /api/branches/[id]/holidays */
export interface HolidayListQuery {
  year?: number;
  month?: number;
}
