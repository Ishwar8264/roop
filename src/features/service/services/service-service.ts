/**
 * Purpose: Service catalog business logic service
 * Responsibility: All service, category, variant, and add-on CRUD operations
 * Important Notes:
 *   - Business logic lives HERE, NOT in route handlers
 *   - Soft delete only — never hard delete
 *   - Decimal handling: price comes as number → Prisma Decimal, returned as number
 *   - Slug unique constraint handled gracefully (P2002 error)
 *   - Hindi-first user-facing messages in errors
 *   - URL-based ID extraction from request.url pathname
 */

import { prisma } from "@/lib/database/prisma";
import { requireAdmin } from "@/lib/server/auth-hooks";
import {
  ServiceCategoryNotFoundError,
  ServiceCategorySlugExistsError,
  ServiceCategoryAlreadyInactiveError,
  ServiceNotFoundError,
  ServiceSlugExistsError,
  ServiceAlreadyInactiveError,
  ServiceVariantNotFoundError,
  ServiceVariantAlreadyInactiveError,
  ServiceAddOnNotFoundError,
  ServiceAddOnAlreadyInactiveError,
} from "@/lib/server/errors";
import type { NextRequest } from "next/server";
import type {
  ServiceCategoryResponse,
  ServiceCategoryListResponse,
  ServiceResponse,
  ServiceDetailResponse,
  ServiceListResponse,
  ServiceVariantResponse,
  ServiceAddOnResponse,
  ServiceListQuery,
  ServiceCategoryListQuery,
} from "@/features/service/types";
import type {
  CreateServiceCategoryInput,
  UpdateServiceCategoryInput,
  CreateServiceInput,
  UpdateServiceInput,
  CreateServiceVariantInput,
  UpdateServiceVariantInput,
  CreateServiceAddOnInput,
  UpdateServiceAddOnInput,
} from "@/features/service/validations/service";
import type { Prisma } from "@prisma/client";

// Re-export requireAdmin for convenience in route files
export { requireAdmin };

// ==================== URL HELPERS ====================

/**
 * Extract service category ID from URL pathname
 * Works for /api/service-categories/[id] patterns
 */
export function extractCategoryIdFromUrl(url: string): string {
  const pathname = new URL(url).pathname;
  const segments = pathname.split("/").filter(Boolean);
  // /api/service-categories/[id] → segments: ['api', 'service-categories', 'id']
  return segments[2] || "";
}

/**
 * Extract service ID from URL pathname
 * Works for /api/services/[id]/... patterns
 */
export function extractServiceIdFromUrl(url: string): string {
  const pathname = new URL(url).pathname;
  const segments = pathname.split("/").filter(Boolean);
  // /api/services/[id]/... → segments: ['api', 'services', 'id', ...]
  return segments[2] || "";
}

/**
 * Extract variant ID from URL pathname
 * Works for /api/services/[id]/variants/[variantId]
 */
export function extractVariantIdFromUrl(url: string): string {
  const pathname = new URL(url).pathname;
  const segments = pathname.split("/").filter(Boolean);
  // /api/services/[id]/variants/[variantId] → segments: ['api', 'services', 'id', 'variants', 'variantId']
  return segments[4] || "";
}

/**
 * Extract add-on ID from URL pathname
 * Works for /api/services/[id]/add-ons/[addOnId]
 */
export function extractAddOnIdFromUrl(url: string): string {
  const pathname = new URL(url).pathname;
  const segments = pathname.split("/").filter(Boolean);
  // /api/services/[id]/add-ons/[addOnId] → segments: ['api', 'services', 'id', 'add-ons', 'addOnId']
  return segments[4] || "";
}

// ==================== DECIMAL HELPER ====================

/** Convert Prisma Decimal to number for API response */
function decimalToNumber(value: unknown): number {
  if (value === null || value === undefined) return 0;
  return Number(value);
}

// ==================== MAPPER ====================

/** Map Prisma ServiceCategory to API response */
function mapCategoryToResponse(category: {
  id: string;
  nameHi: string;
  nameEn: string;
  slug: string;
  icon: string | null;
  sortOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}): ServiceCategoryResponse {
  return {
    id: category.id,
    nameHi: category.nameHi,
    nameEn: category.nameEn,
    slug: category.slug,
    icon: category.icon,
    sortOrder: category.sortOrder,
    isActive: category.isActive,
    createdAt: category.createdAt.toISOString(),
    updatedAt: category.updatedAt.toISOString(),
  };
}

/** Map Prisma Service (with category + variant count) to list API response */
function mapServiceToListResponse(service: {
  id: string;
  nameHi: string;
  nameEn: string;
  slug: string;
  descriptionHi: string;
  descriptionEn: string | null;
  descriptionHtml: string | null;
  price: unknown;
  durationMinutes: number;
  imageUrl: string | null;
  isActive: boolean;
  branchId: string;
  categoryId: string;
  createdAt: Date;
  updatedAt: Date;
  category: { nameHi: string; nameEn: string };
  _count?: { variants: number };
}): ServiceResponse {
  return {
    id: service.id,
    nameHi: service.nameHi,
    nameEn: service.nameEn,
    slug: service.slug,
    descriptionHi: service.descriptionHi,
    descriptionEn: service.descriptionEn,
    descriptionHtml: service.descriptionHtml,
    price: decimalToNumber(service.price),
    durationMinutes: service.durationMinutes,
    imageUrl: service.imageUrl,
    isActive: service.isActive,
    branchId: service.branchId,
    categoryId: service.categoryId,
    categoryNameHi: service.category.nameHi,
    categoryNameEn: service.category.nameEn,
    variantCount: service._count?.variants ?? 0,
    createdAt: service.createdAt.toISOString(),
    updatedAt: service.updatedAt.toISOString(),
  };
}

/** Map Prisma ServiceVariant to API response */
function mapVariantToResponse(variant: {
  id: string;
  serviceId: string;
  nameHi: string;
  nameEn: string;
  price: unknown;
  durationMinutes: number;
  isActive: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}): ServiceVariantResponse {
  return {
    id: variant.id,
    serviceId: variant.serviceId,
    nameHi: variant.nameHi,
    nameEn: variant.nameEn,
    price: decimalToNumber(variant.price),
    durationMinutes: variant.durationMinutes,
    isActive: variant.isActive,
    sortOrder: variant.sortOrder,
    createdAt: variant.createdAt.toISOString(),
    updatedAt: variant.updatedAt.toISOString(),
  };
}

/** Map Prisma ServiceAddOn to API response */
function mapAddOnToResponse(addOn: {
  id: string;
  serviceId: string;
  nameHi: string;
  nameEn: string;
  price: unknown;
  durationMinutes: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}): ServiceAddOnResponse {
  return {
    id: addOn.id,
    serviceId: addOn.serviceId,
    nameHi: addOn.nameHi,
    nameEn: addOn.nameEn,
    price: decimalToNumber(addOn.price),
    durationMinutes: addOn.durationMinutes,
    isActive: addOn.isActive,
    createdAt: addOn.createdAt.toISOString(),
    updatedAt: addOn.updatedAt.toISOString(),
  };
}

// ==================== SERVICE CATEGORY CRUD ====================

/**
 * List service categories
 * Public endpoint — no auth required
 */
export async function listServiceCategories(query: ServiceCategoryListQuery): Promise<ServiceCategoryListResponse> {
  const { includeInactive = false } = query;

  const where: Prisma.ServiceCategoryWhereInput = {};

  if (!includeInactive) {
    where.isActive = true;
  }

  const [categories, total] = await Promise.all([
    prisma.serviceCategory.findMany({
      where,
      orderBy: [{ sortOrder: "asc" }, { nameEn: "asc" }],
    }),
    prisma.serviceCategory.count({ where }),
  ]);

  return {
    categories: categories.map(mapCategoryToResponse),
    total,
  };
}

/**
 * Create a new service category
 * Admin only
 */
export async function createServiceCategory(data: CreateServiceCategoryInput): Promise<ServiceCategoryResponse> {
  try {
    const category = await prisma.serviceCategory.create({
      data: {
        nameHi: data.nameHi,
        nameEn: data.nameEn,
        slug: data.slug,
        icon: data.icon ?? null,
        sortOrder: data.sortOrder ?? 0,
      },
    });

    return mapCategoryToResponse(category);
  } catch (error) {
    // Handle unique constraint on slug
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw new ServiceCategorySlugExistsError();
    }
    throw error;
  }
}

/**
 * Update an existing service category (partial update)
 * Admin only
 */
export async function updateServiceCategory(id: string, data: UpdateServiceCategoryInput): Promise<ServiceCategoryResponse> {
  const existing = await prisma.serviceCategory.findUnique({ where: { id } });
  if (!existing) {
    throw new ServiceCategoryNotFoundError();
  }

  const updateData: Prisma.ServiceCategoryUpdateInput = {};

  if (data.nameHi !== undefined) updateData.nameHi = data.nameHi;
  if (data.nameEn !== undefined) updateData.nameEn = data.nameEn;
  if (data.slug !== undefined) updateData.slug = data.slug;
  if (data.icon !== undefined) updateData.icon = data.icon ?? null;
  if (data.sortOrder !== undefined) updateData.sortOrder = data.sortOrder;

  try {
    const category = await prisma.serviceCategory.update({
      where: { id },
      data: updateData,
    });

    return mapCategoryToResponse(category);
  } catch (error) {
    // Handle unique constraint on slug
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw new ServiceCategorySlugExistsError();
    }
    throw error;
  }
}

/**
 * Soft delete service category — sets isActive = false
 * Admin only
 */
export async function deactivateServiceCategory(id: string): Promise<ServiceCategoryResponse> {
  const existing = await prisma.serviceCategory.findUnique({ where: { id } });
  if (!existing) {
    throw new ServiceCategoryNotFoundError();
  }

  if (!existing.isActive) {
    throw new ServiceCategoryAlreadyInactiveError();
  }

  const category = await prisma.serviceCategory.update({
    where: { id },
    data: { isActive: false },
  });

  return mapCategoryToResponse(category);
}

// ==================== SERVICE CRUD ====================

/**
 * List services with filtering and pagination
 * Public endpoint — no auth required
 */
export async function listServices(query: ServiceListQuery): Promise<ServiceListResponse> {
  const { branchId, categoryId, includeInactive = false, page = 1, limit = 20 } = query;

  const where: Prisma.ServiceWhereInput = {};

  if (branchId) {
    where.branchId = branchId;
  }

  if (categoryId) {
    where.categoryId = categoryId;
  }

  if (!includeInactive) {
    where.isActive = true;
  }

  const skip = (page - 1) * limit;
  const take = limit;

  const [services, total] = await Promise.all([
    prisma.service.findMany({
      where,
      orderBy: [{ nameEn: "asc" }],
      skip,
      take,
      include: {
        category: {
          select: { nameHi: true, nameEn: true },
        },
        _count: {
          select: { variants: true },
        },
      },
    }),
    prisma.service.count({ where }),
  ]);

  return {
    services: services.map(mapServiceToListResponse),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

/**
 * Get single service with category, variants, and addOns
 * Public endpoint — no auth required
 */
export async function getServiceById(id: string): Promise<ServiceDetailResponse> {
  const service = await prisma.service.findUnique({
    where: { id },
    include: {
      category: true,
      variants: {
        where: { isActive: true },
        orderBy: [{ sortOrder: "asc" }, { nameEn: "asc" }],
      },
      addOns: {
        where: { isActive: true },
        orderBy: [{ nameEn: "asc" }],
      },
    },
  });

  if (!service) {
    throw new ServiceNotFoundError();
  }

  const { category, variants, addOns, ...serviceData } = service;

  return {
    ...mapServiceToListResponse({ ...serviceData, category: { nameHi: category.nameHi, nameEn: category.nameEn }, _count: { variants: variants.length } }),
    category: mapCategoryToResponse(category),
    variants: variants.map(mapVariantToResponse),
    addOns: addOns.map(mapAddOnToResponse),
  };
}

/**
 * Create a new service
 * Admin only
 */
export async function createService(data: CreateServiceInput): Promise<ServiceResponse> {
  try {
    const service = await prisma.service.create({
      data: {
        nameHi: data.nameHi,
        nameEn: data.nameEn,
        slug: data.slug,
        descriptionHi: data.descriptionHi,
        descriptionEn: data.descriptionEn ?? null,
        descriptionHtml: data.descriptionHtml ?? null,
        price: data.price,
        durationMinutes: data.durationMinutes,
        imageUrl: data.imageUrl ?? null,
        branchId: data.branchId,
        categoryId: data.categoryId,
      },
      include: {
        category: {
          select: { nameHi: true, nameEn: true },
        },
        _count: {
          select: { variants: true },
        },
      },
    });

    return mapServiceToListResponse(service);
  } catch (error) {
    // Handle unique constraint on slug
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw new ServiceSlugExistsError();
    }
    throw error;
  }
}

/**
 * Update an existing service (partial update)
 * Admin only
 */
export async function updateService(id: string, data: UpdateServiceInput): Promise<ServiceResponse> {
  const existing = await prisma.service.findUnique({ where: { id } });
  if (!existing) {
    throw new ServiceNotFoundError();
  }

  const updateData: Prisma.ServiceUpdateInput = {};

  if (data.nameHi !== undefined) updateData.nameHi = data.nameHi;
  if (data.nameEn !== undefined) updateData.nameEn = data.nameEn;
  if (data.slug !== undefined) updateData.slug = data.slug;
  if (data.descriptionHi !== undefined) updateData.descriptionHi = data.descriptionHi;
  if (data.descriptionEn !== undefined) updateData.descriptionEn = data.descriptionEn ?? null;
  if (data.descriptionHtml !== undefined) updateData.descriptionHtml = data.descriptionHtml ?? null;
  if (data.price !== undefined) updateData.price = data.price;
  if (data.durationMinutes !== undefined) updateData.durationMinutes = data.durationMinutes;
  if (data.imageUrl !== undefined) updateData.imageUrl = data.imageUrl ?? null;
  if (data.branchId !== undefined) updateData.branch = { connect: { id: data.branchId } };
  if (data.categoryId !== undefined) updateData.category = { connect: { id: data.categoryId } };

  try {
    const service = await prisma.service.update({
      where: { id },
      data: updateData,
      include: {
        category: {
          select: { nameHi: true, nameEn: true },
        },
        _count: {
          select: { variants: true },
        },
      },
    });

    return mapServiceToListResponse(service);
  } catch (error) {
    // Handle unique constraint on slug
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw new ServiceSlugExistsError();
    }
    throw error;
  }
}

/**
 * Soft delete service — sets isActive = false
 * Admin only
 */
export async function deactivateService(id: string): Promise<ServiceResponse> {
  const existing = await prisma.service.findUnique({ where: { id } });
  if (!existing) {
    throw new ServiceNotFoundError();
  }

  if (!existing.isActive) {
    throw new ServiceAlreadyInactiveError();
  }

  const service = await prisma.service.update({
    where: { id },
    data: { isActive: false },
    include: {
      category: {
        select: { nameHi: true, nameEn: true },
      },
      _count: {
        select: { variants: true },
      },
    },
  });

  return mapServiceToListResponse(service);
}

// ==================== SERVICE VARIANT CRUD ====================

/**
 * List variants for a service
 * Public endpoint
 */
export async function listServiceVariants(serviceId: string): Promise<ServiceVariantResponse[]> {
  // Verify service exists
  const service = await prisma.service.findUnique({ where: { id: serviceId } });
  if (!service) {
    throw new ServiceNotFoundError();
  }

  const variants = await prisma.serviceVariant.findMany({
    where: { serviceId, isActive: true },
    orderBy: [{ sortOrder: "asc" }, { nameEn: "asc" }],
  });

  return variants.map(mapVariantToResponse);
}

/**
 * Create a new service variant
 * Admin only
 */
export async function createServiceVariant(
  serviceId: string,
  data: CreateServiceVariantInput
): Promise<ServiceVariantResponse> {
  // Verify service exists
  const service = await prisma.service.findUnique({ where: { id: serviceId } });
  if (!service) {
    throw new ServiceNotFoundError();
  }

  const variant = await prisma.serviceVariant.create({
    data: {
      serviceId,
      nameHi: data.nameHi,
      nameEn: data.nameEn,
      price: data.price,
      durationMinutes: data.durationMinutes,
      sortOrder: data.sortOrder ?? 0,
    },
  });

  return mapVariantToResponse(variant);
}

/**
 * Update a service variant
 * Admin only
 */
export async function updateServiceVariant(
  serviceId: string,
  variantId: string,
  data: UpdateServiceVariantInput
): Promise<ServiceVariantResponse> {
  // Verify variant exists and belongs to this service
  const variant = await prisma.serviceVariant.findFirst({
    where: { id: variantId, serviceId },
  });

  if (!variant) {
    throw new ServiceVariantNotFoundError();
  }

  const updateData: Prisma.ServiceVariantUpdateInput = {};

  if (data.nameHi !== undefined) updateData.nameHi = data.nameHi;
  if (data.nameEn !== undefined) updateData.nameEn = data.nameEn;
  if (data.price !== undefined) updateData.price = data.price;
  if (data.durationMinutes !== undefined) updateData.durationMinutes = data.durationMinutes;
  if (data.sortOrder !== undefined) updateData.sortOrder = data.sortOrder;

  const updated = await prisma.serviceVariant.update({
    where: { id: variantId },
    data: updateData,
  });

  return mapVariantToResponse(updated);
}

/**
 * Soft delete service variant — sets isActive = false
 * Admin only
 */
export async function deactivateServiceVariant(
  serviceId: string,
  variantId: string
): Promise<ServiceVariantResponse> {
  // Verify variant exists and belongs to this service
  const variant = await prisma.serviceVariant.findFirst({
    where: { id: variantId, serviceId },
  });

  if (!variant) {
    throw new ServiceVariantNotFoundError();
  }

  if (!variant.isActive) {
    throw new ServiceVariantAlreadyInactiveError();
  }

  const updated = await prisma.serviceVariant.update({
    where: { id: variantId },
    data: { isActive: false },
  });

  return mapVariantToResponse(updated);
}

// ==================== SERVICE ADD-ON CRUD ====================

/**
 * List add-ons for a service
 * Public endpoint
 */
export async function listServiceAddOns(serviceId: string): Promise<ServiceAddOnResponse[]> {
  // Verify service exists
  const service = await prisma.service.findUnique({ where: { id: serviceId } });
  if (!service) {
    throw new ServiceNotFoundError();
  }

  const addOns = await prisma.serviceAddOn.findMany({
    where: { serviceId, isActive: true },
    orderBy: [{ nameEn: "asc" }],
  });

  return addOns.map(mapAddOnToResponse);
}

/**
 * Create a new service add-on
 * Admin only
 */
export async function createServiceAddOn(
  serviceId: string,
  data: CreateServiceAddOnInput
): Promise<ServiceAddOnResponse> {
  // Verify service exists
  const service = await prisma.service.findUnique({ where: { id: serviceId } });
  if (!service) {
    throw new ServiceNotFoundError();
  }

  const addOn = await prisma.serviceAddOn.create({
    data: {
      serviceId,
      nameHi: data.nameHi,
      nameEn: data.nameEn,
      price: data.price,
      durationMinutes: data.durationMinutes,
    },
  });

  return mapAddOnToResponse(addOn);
}

/**
 * Update a service add-on
 * Admin only
 */
export async function updateServiceAddOn(
  serviceId: string,
  addOnId: string,
  data: UpdateServiceAddOnInput
): Promise<ServiceAddOnResponse> {
  // Verify add-on exists and belongs to this service
  const addOn = await prisma.serviceAddOn.findFirst({
    where: { id: addOnId, serviceId },
  });

  if (!addOn) {
    throw new ServiceAddOnNotFoundError();
  }

  const updateData: Prisma.ServiceAddOnUpdateInput = {};

  if (data.nameHi !== undefined) updateData.nameHi = data.nameHi;
  if (data.nameEn !== undefined) updateData.nameEn = data.nameEn;
  if (data.price !== undefined) updateData.price = data.price;
  if (data.durationMinutes !== undefined) updateData.durationMinutes = data.durationMinutes;

  const updated = await prisma.serviceAddOn.update({
    where: { id: addOnId },
    data: updateData,
  });

  return mapAddOnToResponse(updated);
}

/**
 * Soft delete service add-on — sets isActive = false
 * Admin only
 */
export async function deactivateServiceAddOn(
  serviceId: string,
  addOnId: string
): Promise<ServiceAddOnResponse> {
  // Verify add-on exists and belongs to this service
  const addOn = await prisma.serviceAddOn.findFirst({
    where: { id: addOnId, serviceId },
  });

  if (!addOn) {
    throw new ServiceAddOnNotFoundError();
  }

  if (!addOn.isActive) {
    throw new ServiceAddOnAlreadyInactiveError();
  }

  const updated = await prisma.serviceAddOn.update({
    where: { id: addOnId },
    data: { isActive: false },
  });

  return mapAddOnToResponse(updated);
}
