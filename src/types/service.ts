/**
 * Purpose: Service catalog domain types
 * Responsibility: Types matching ServiceCategory, Service, ServiceVariant,
 *                ServiceAddOn, Package, PackageService Prisma models
 */

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
