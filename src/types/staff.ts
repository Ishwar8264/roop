/**
 * Purpose: Staff domain types
 * Responsibility: Types matching Staff, StaffService, StaffLeave Prisma models
 */

export interface Staff {
  id: string;
  userId: string;
  branchId: string;
  specialization: string[]; // Text[] — ["facial","bridal_makeup"]
  experienceYears: number | null;
  bioHi: string | null;
  bioEn: string | null;
  photoUrl: string | null;
  rating: string; // Decimal(3,2) — "4.90"
  isAvailable: boolean;
  workDays: Record<string, boolean>; // Json — {mon: true, ...}
  workStart: string; // Time(0) — "09:00"
  workEnd: string; // Time(0) — "19:00"
  commissionRate: string | null; // Decimal(5,2) — "15.00"
  createdAt: Date;
  updatedAt: Date;
}

export interface StaffService {
  id: string;
  staffId: string;
  serviceId: string;
}

export interface StaffLeave {
  id: string;
  staffId: string;
  date: string; // Date — "2026-05-29"
  reason: string | null;
  createdAt: Date;
}
