/**
 * Purpose: Staff feature types — shared across service, routes, and client
 * Responsibility: Type definitions for staff, staff-service, and staff-leave APIs
 * Important Notes:
 *   - These are API response types — never expose raw Prisma models
 *   - Time fields returned as "HH:mm" strings for frontend convenience
 *   - Date fields returned as "YYYY-MM-DD" strings
 *   - Decimal fields (rating, commissionRate) returned as numbers
 *   - workDays is a JSON object with day-of-week boolean keys
 */

// ==================== STAFF ====================

/** Work days structure — maps day abbreviations to boolean */
export interface WorkDays {
  mon: boolean;
  tue: boolean;
  wed: boolean;
  thu: boolean;
  fri: boolean;
  sat: boolean;
  sun: boolean;
}

/** Staff data returned in list API responses */
export interface StaffResponse {
  id: string;
  userId: string;
  branchId: string;
  userName: string | null;
  userPhone: string | null;
  userAvatarUrl: string | null;
  branchNameHi: string;
  branchNameEn: string;
  specialization: string[];
  experienceYears: number | null;
  bioHi: string | null;
  bioEn: string | null;
  photoUrl: string | null;
  rating: number;
  isAvailable: boolean;
  workDays: WorkDays;
  workStart: string; // "09:00"
  workEnd: string; // "19:00"
  commissionRate: number | null;
  createdAt: string;
  updatedAt: string;
}

/** Staff detail response — includes user info, branch, services, leaves */
export interface StaffDetailResponse extends Omit<StaffResponse, 'branchNameHi' | 'branchNameEn'> {
  branch: {
    id: string;
    nameHi: string;
    nameEn: string;
    city: string;
  };
  services: StaffServiceItemResponse[];
  upcomingLeaves: StaffLeaveResponse[];
}

/** Paginated staff list response */
export interface StaffListResponse {
  staff: StaffResponse[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ==================== STAFF SERVICE ====================

/** Service info within staff service assignment */
export interface StaffServiceItemResponse {
  id: string; // StaffService id
  serviceId: string;
  nameHi: string;
  nameEn: string;
  price: number;
  durationMinutes: number;
}

// ==================== STAFF LEAVE ====================

/** Staff leave data returned in API responses */
export interface StaffLeaveResponse {
  id: string;
  staffId: string;
  date: string; // "2026-05-15"
  reason: string | null;
  createdAt: string;
}

// ==================== QUERY / FILTER TYPES ====================

/** Query params for GET /api/staff */
export interface StaffListQuery {
  branchId?: string;
  specialization?: string;
  isAvailable?: boolean;
  page?: number;
  limit?: number;
}

/** Query params for GET /api/staff/[id]/leaves */
export interface StaffLeaveListQuery {
  year?: number;
  month?: number;
}

/** Bulk assign services result */
export interface BulkAssignServicesResult {
  assigned: number;
  skipped: number;
  total: number;
}
