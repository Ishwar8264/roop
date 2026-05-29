/**
 * Purpose: Branch and location types
 * Responsibility: Types matching Branch, BranchHoliday Prisma models
 */

export interface Branch {
  id: string;
  nameHi: string;
  nameEn: string;
  city: string;
  address: string;
  googleMapsUrl: string | null;
  phone: string;
  openTime: string; // Time(0) — "09:00"
  closeTime: string; // Time(0) — "20:00"
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface BranchHoliday {
  id: string;
  branchId: string;
  date: string; // Date — "2026-03-14"
  reasonHi: string;
  reasonEn: string | null;
  createdAt: Date;
}
