/**
 * Purpose: Product & Inventory domain types
 * Responsibility: Types matching ProductCategory, Product, ProductSale,
 *                ProductSaleItem, InventoryItem, InventoryTransaction,
 *                Expense, StaffCommission, MediaAsset, PortfolioItem,
 *                BlogCategory, BlogPost, Notification, RevenueSnapshot Prisma models
 */

import type {
  ProductSaleStatus,
  InventoryTransactionType,
  ExpenseCategory,
  StaffCommissionStatus,
  MediaOwnerType,
  BlogPostStatus,
  NotificationChannel,
  NotificationStatus,
  NotificationTrigger,
  PaymentProvider,
} from "./enums";

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
