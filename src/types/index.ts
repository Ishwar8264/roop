/**
 * Purpose: Shared TypeScript types for Nikharta Roop application
 * Responsibility: Central type definitions used across features
 * Important Notes: Keep types generic and reusable; feature-specific types go in features/
 */

// ==================== User Types ====================

export type UserRole = "GUEST" | "USER" | "STAFF" | "ADMIN";

export interface User {
  id: string;
  mobile: string;
  name: string | null;
  email: string | null;
  role: UserRole;
  branchId: string | null;
  avatarUrl: string | null;
  loyaltyPoints: number;
  isActive: boolean;
  createdAt: Date;
  lastLoginAt: Date | null;
}

// ==================== Service Types ====================

export interface Service {
  id: string;
  nameHi: string;
  nameEn: string;
  descriptionHi: string;
  categoryId: string;
  price: number;
  durationMinutes: number;
  imageUrl: string | null;
  isActive: boolean;
  branchId: string;
  createdAt: Date;
}

export interface Category {
  id: string;
  nameHi: string;
  nameEn: string;
  icon: string | null;
  sortOrder: number;
}

// ==================== Booking Types ====================

export type BookingStatus =
  | "PENDING"
  | "CONFIRMED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED"
  | "NO_SHOW";

export interface Booking {
  id: string;
  userId: string;
  serviceId: string;
  staffId: string | null;
  branchId: string;
  bookingDate: string;
  slotStart: string;
  slotEnd: string;
  status: BookingStatus;
  advanceAmount: number | null;
  totalAmount: number;
  paymentId: string | null;
  cancellationReason: string | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// ==================== Staff Types ====================

export interface Staff {
  id: string;
  userId: string;
  branchId: string;
  specialization: string[];
  experienceYears: number | null;
  bioHi: string | null;
  photoUrl: string | null;
  rating: number;
  isAvailable: boolean;
  workDays: Record<string, boolean>;
  workStart: string;
  workEnd: string;
}

// ==================== Review Types ====================

export interface Review {
  id: string;
  userId: string;
  bookingId: string;
  staffId: string | null;
  serviceId: string;
  rating: number;
  commentHi: string | null;
  isApproved: boolean;
  createdAt: Date;
}

// ==================== Offer Types ====================

export type DiscountType = "PERCENTAGE" | "FLAT_AMOUNT";

export interface Offer {
  id: string;
  code: string;
  titleHi: string;
  discountType: DiscountType;
  discountValue: number;
  minOrder: number | null;
  maxDiscount: number | null;
  validFrom: Date;
  validUntil: Date;
  usageLimit: number | null;
  usageCount: number;
  applicableServices: string[] | null;
  isActive: boolean;
}

// ==================== Branch Types ====================

export interface Branch {
  id: string;
  nameHi: string;
  city: string;
  address: string;
  googleMapsUrl: string | null;
  phone: string;
  openTime: string;
  closeTime: string;
  isActive: boolean;
}

// ==================== Auth Types ====================

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface OTPVerifyResponse {
  token: string;
  user: User;
  isNewUser: boolean;
}

// ==================== API Types ====================

export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
}

export interface ApiError {
  error: string;
  message: string;
  statusCode: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// ==================== Slot Types ====================

export interface TimeSlot {
  start: string;
  end: string;
  available: boolean;
}

// ==================== Notification Types ====================

export type NotificationChannel = "WHATSAPP" | "SMS" | "EMAIL" | "PUSH";

export interface Notification {
  id: string;
  userId: string;
  channel: NotificationChannel;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: Date;
}
