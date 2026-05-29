/**
 * Purpose: Shared TypeScript types for Nikharta Roop application
 * Responsibility: Central type definitions used across features
 * Important Notes:
 *   - Keep types generic and reusable; feature-specific types go in features/
 *   - Matches Prisma schema models 1:1 — update when schema changes
 *   - Decimal fields typed as string (Prisma Decimal → string in API)
 */

// ==================== Enum Types ====================

export type UserRole = "GUEST" | "USER" | "STAFF" | "ADMIN";

export type AuthOtpPurpose = "LOGIN" | "REGISTER" | "RESET";

export type AuthEventType =
  | "LOGIN_SUCCESS"
  | "LOGIN_FAILED"
  | "OTP_SENT"
  | "OTP_VERIFIED"
  | "LOGOUT"
  | "TOKEN_REFRESHED";

export type BookingStatus =
  | "PENDING"
  | "CONFIRMED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED"
  | "NO_SHOW";

export type PaymentStatus = "PENDING" | "SUCCESS" | "FAILED" | "REFUNDED";

export type PaymentProvider = "RAZORPAY" | "CASH" | "UPI";

export type NotificationChannel = "WHATSAPP" | "SMS" | "EMAIL" | "PUSH";

export type NotificationStatus = "PENDING" | "SENT" | "FAILED";

export type NotificationTrigger =
  | "BOOKING_CONFIRMED"
  | "BOOKING_REMINDER"
  | "BOOKING_CANCELLED"
  | "PAYMENT_RECEIVED"
  | "OFFER_APPLIED"
  | "LOYALTY_EARNED"
  | "LOYALTY_REDEEMED";

export type DiscountType = "PERCENTAGE" | "FLAT_AMOUNT";

export type LoyaltyTransactionType = "EARN" | "REDEEM" | "EXPIRE";

export type BlogPostStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";

export type ProductSaleStatus = "PENDING" | "COMPLETED" | "CANCELLED";

export type ConsultationStatus = "PENDING" | "COMPLETED" | "CANCELLED";

export type RefundStatus = "PENDING" | "APPROVED" | "REJECTED" | "PROCESSED";

export type InventoryTransactionType = "PURCHASE" | "SALE" | "ADJUSTMENT" | "DAMAGE";

export type ExpenseCategory = "RENT" | "SALARY" | "SUPPLIES" | "UTILITIES" | "MARKETING" | "MAINTENANCE" | "OTHER";

export type StaffCommissionStatus = "PENDING" | "PAID";

export type MediaOwnerType = "SERVICE" | "STAFF" | "PORTFOLIO" | "BRANCH" | "BLOG" | "PRODUCT" | "OFFER";

// ==================== Branch Types ====================

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

// ==================== Auth Types ====================

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
  updatedAt: Date;
}

export interface AuthSession {
  id: string;
  userId: string;
  token: string;
  device: string | null;
  ip: string | null;
  expiresAt: Date;
  createdAt: Date;
}

export interface AuthOtp {
  id: string;
  mobile: string;
  otp: string;
  purpose: AuthOtpPurpose;
  attempts: number;
  isUsed: boolean;
  expiresAt: Date;
  createdAt: Date;
}

export interface AuthEvent {
  id: string;
  userId: string | null;
  mobile: string;
  event: AuthEventType;
  ip: string | null;
  device: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
}

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

// ==================== Service Catalog Types ====================

export interface ServiceCategory {
  id: string;
  nameHi: string;
  nameEn: string;
  slug: string;
  icon: string | null;
  sortOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Service {
  id: string;
  nameHi: string;
  nameEn: string;
  slug: string;
  descriptionHi: string;
  descriptionEn: string | null;
  descriptionHtml: string | null;
  price: string; // Decimal — "500.00"
  durationMinutes: number;
  imageUrl: string | null;
  isActive: boolean;
  branchId: string;
  categoryId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ServiceVariant {
  id: string;
  serviceId: string;
  nameHi: string;
  nameEn: string;
  price: string; // Decimal
  durationMinutes: number;
  isActive: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ServiceAddOn {
  id: string;
  serviceId: string;
  nameHi: string;
  nameEn: string;
  price: string; // Decimal
  durationMinutes: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Package {
  id: string;
  nameHi: string;
  nameEn: string;
  slug: string;
  descriptionHi: string;
  descriptionEn: string | null;
  price: string; // Decimal
  originalPrice: string; // Decimal
  durationMinutes: number;
  imageUrl: string | null;
  isActive: boolean;
  branchId: string;
  validFrom: Date | null;
  validUntil: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface PackageService {
  id: string;
  packageId: string;
  serviceId: string;
  sortOrder: number;
}

// ==================== Staff Types ====================

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

// ==================== Booking Types ====================

export interface Booking {
  id: string;
  bookingDisplayId: string;
  userId: string;
  serviceId: string;
  variantId: string | null;
  staffId: string | null;
  branchId: string;
  bookingDate: string; // Date — "2026-05-30"
  slotStart: string; // Time(0) — "11:00"
  slotEnd: string; // Time(0) — "12:00"
  status: BookingStatus;
  advanceAmount: string | null; // Decimal
  totalAmount: string; // Decimal
  cancellationReason: string | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface BookingAddOn {
  id: string;
  bookingId: string;
  addOnId: string | null;
  variantId: string | null;
  name: string;
  price: string; // Decimal
  createdAt: Date;
}

export interface BookingStatusHistory {
  id: string;
  bookingId: string;
  status: BookingStatus;
  changedBy: string | null;
  reason: string | null;
  createdAt: Date;
}

export interface BookingOffer {
  id: string;
  bookingId: string;
  offerId: string;
  createdAt: Date;
}

// ==================== Payment Types ====================

export interface Payment {
  id: string;
  bookingId: string;
  amount: string; // Decimal
  provider: PaymentProvider;
  status: PaymentStatus;
  providerRefId: string | null;
  providerOrderId: string | null;
  receiptUrl: string | null;
  metadata: Record<string, unknown> | null;
  paidAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Refund {
  id: string;
  paymentId: string;
  amount: string; // Decimal
  reason: string;
  status: RefundStatus;
  processedBy: string | null;
  providerRefId: string | null;
  metadata: Record<string, unknown> | null;
  processedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

// ==================== Consultation Types ====================

export interface Consultation {
  id: string;
  userId: string;
  bookingId: string | null;
  staffId: string | null;
  branchId: string;
  date: string; // Date
  time: string; // Time(0)
  status: ConsultationStatus;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
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
  commentEn: string | null;
  isApproved: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ==================== Customer Address Types ====================

export interface CustomerAddress {
  id: string;
  userId: string;
  label: string;
  address: string;
  city: string;
  pincode: string;
  landmark: string | null;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ==================== Offer Types ====================

export interface Offer {
  id: string;
  code: string;
  titleHi: string;
  titleEn: string | null;
  descriptionHi: string | null;
  descriptionEn: string | null;
  discountType: DiscountType;
  discountValue: string; // Decimal
  minOrder: string | null; // Decimal
  maxDiscount: string | null; // Decimal
  validFrom: Date;
  validUntil: Date;
  usageLimit: number | null;
  usageCount: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface OfferService {
  id: string;
  offerId: string;
  serviceId: string;
}

export interface OfferRedemption {
  id: string;
  offerId: string;
  userId: string;
  bookingId: string | null;
  createdAt: Date;
}

// ==================== Notification Types ====================

export interface Notification {
  id: string;
  userId: string;
  trigger: NotificationTrigger | null;
  channel: NotificationChannel;
  title: string;
  message: string;
  status: NotificationStatus;
  sentAt: Date | null;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
}

// ==================== Loyalty Types ====================

export interface LoyaltyTransaction {
  id: string;
  userId: string;
  type: LoyaltyTransactionType;
  points: number;
  bookingId: string | null;
  reason: string;
  createdAt: Date;
}

// ==================== Analytics Types ====================

export interface RevenueSnapshot {
  id: string;
  branchId: string;
  date: string; // Date
  period: "daily" | "weekly" | "monthly";
  totalRevenue: string; // Decimal(12,2)
  totalBookings: number;
  avgBookingValue: string; // Decimal
  totalExpenses: string; // Decimal(12,2)
  netProfit: string; // Decimal(12,2)
  createdAt: Date;
}

// ==================== Product Types ====================

export interface ProductCategory {
  id: string;
  nameHi: string;
  nameEn: string;
  slug: string;
  icon: string | null;
  sortOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Product {
  id: string;
  nameHi: string;
  nameEn: string;
  slug: string;
  descriptionHi: string | null;
  descriptionEn: string | null;
  price: string; // Decimal
  costPrice: string | null; // Decimal
  imageUrl: string | null;
  categoryId: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductSale {
  id: string;
  customerId: string;
  branchId: string;
  totalAmount: string; // Decimal
  status: ProductSaleStatus;
  paymentMethod: PaymentProvider | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductSaleItem {
  id: string;
  saleId: string;
  productId: string;
  quantity: number;
  unitPrice: string; // Decimal
  totalPrice: string; // Decimal
}

// ==================== Inventory Types ====================

export interface InventoryItem {
  id: string;
  productId: string;
  branchId: string;
  quantity: number;
  lowStockThreshold: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface InventoryTransaction {
  id: string;
  inventoryItemId: string;
  type: InventoryTransactionType;
  quantity: number;
  reason: string | null;
  performedBy: string | null;
  createdAt: Date;
}

// ==================== Expense Types ====================

export interface Expense {
  id: string;
  branchId: string;
  category: ExpenseCategory;
  amount: string; // Decimal
  description: string;
  date: string; // Date
  receiptUrl: string | null;
  recordedBy: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// ==================== Staff Commission Types ====================

export interface StaffCommission {
  id: string;
  staffId: string;
  bookingId: string;
  amount: string; // Decimal
  rate: string; // Decimal(5,2)
  status: StaffCommissionStatus;
  paidAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

// ==================== Media Types ====================

export interface MediaAsset {
  id: string;
  ownerId: string;
  ownerType: MediaOwnerType;
  url: string;
  altHi: string | null;
  altEn: string | null;
  mimeType: string | null;
  fileSize: number | null;
  sortOrder: number;
  isActive: boolean;
  createdAt: Date;
}

// ==================== Portfolio Types ====================

export interface PortfolioItem {
  id: string;
  staffId: string;
  titleHi: string | null;
  titleEn: string | null;
  imageUrl: string;
  isFeatured: boolean;
  createdAt: Date;
}

// ==================== Blog Types ====================

export interface BlogCategory {
  id: string;
  nameHi: string;
  nameEn: string;
  slug: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface BlogPost {
  id: string;
  categoryId: string;
  titleHi: string;
  titleEn: string;
  slug: string;
  contentHi: string;
  contentEn: string | null;
  excerptHi: string | null;
  excerptEn: string | null;
  coverImageUrl: string | null;
  status: BlogPostStatus;
  authorId: string | null;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
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
