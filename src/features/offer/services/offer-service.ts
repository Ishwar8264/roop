/**
 * Purpose: Offer business logic service
 * Responsibility: All offer CRUD operations + service assignment + promo code validation
 * Important Notes:
 *   - Business logic lives HERE, NOT in route handlers
 *   - Soft delete only — set isActive = false (never hard delete)
 *   - Decimal handling: all money fields as Prisma Decimal, return as numbers
 *   - Code immutability: offer code cannot be changed after creation
 *   - Hindi-first user-facing messages in errors
 *   - URL-based ID extraction from request.url pathname
 *   - Bulk service link: skip already-linked services gracefully (same as staff service assignment)
 *   - Validate endpoint: full validation chain — exists, active, dates, usage, minOrder, service applicable
 *   - Offer validation shares similar logic with booking-service but returns richer detail
 */

import { prisma } from "@/lib/database/prisma";
import { requireAdmin, requireAuth } from "@/lib/server/auth-hooks";
import {
  OfferNotFoundError,
  OfferCodeExistsError,
  OfferExpiredError,
  OfferNotYetActiveError,
  OfferUsageLimitReachedError,
  OfferMinOrderNotMetError,
  OfferNotApplicableError,
  OfferServiceLinkNotFoundError,
  OfferCodeImmutableError,
  ServiceNotFoundError,
} from "@/lib/server/errors";
import type {
  OfferResponse,
  OfferDetailResponse,
  OfferListResponse,
  OfferServiceItemResponse,
  OfferListQuery,
  BulkLinkServicesResult,
  OfferValidationResponse,
  DiscountType,
} from "@/features/offer/types";
import type {
  CreateOfferInput,
  UpdateOfferInput,
} from "@/features/offer/validations/offer";
import { Prisma } from "@prisma/client";

// Re-export auth hooks for convenience in route files
export { requireAdmin, requireAuth };

// ==================== DECIMAL HELPERS ====================

/** Convert Prisma Decimal to number for API response */
function decimalToNumber(value: unknown): number {
  if (value === null || value === undefined) return 0;
  return Number(value);
}

/** Convert Prisma Decimal to number or null for API response */
function decimalToNumberOrNull(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  return Number(value);
}

// ==================== URL HELPERS ====================

/**
 * Extract offer ID from URL pathname
 * Works for /api/offers/[id]/... patterns
 */
export function extractOfferIdFromUrl(url: string): string {
  const pathname = new URL(url).pathname;
  const segments = pathname.split("/").filter(Boolean);
  // /api/offers/[id]/... → segments: ['api', 'offers', 'id', ...]
  return segments[2] || "";
}

/**
 * Extract service ID from URL pathname for offer service routes
 * Works for /api/offers/[id]/services/[serviceId]
 */
export function extractServiceIdFromOfferUrl(url: string): string {
  const pathname = new URL(url).pathname;
  const segments = pathname.split("/").filter(Boolean);
  // /api/offers/[id]/services/[serviceId] → segments: ['api', 'offers', 'id', 'services', 'serviceId']
  return segments[4] || "";
}

// ==================== MAPPER ====================

/** Map Prisma Offer to list API response */
function mapOfferToResponse(offer: {
  id: string;
  code: string;
  titleHi: string;
  titleEn: string | null;
  descriptionHi: string | null;
  descriptionEn: string | null;
  discountType: string;
  discountValue: unknown;
  minOrder: unknown;
  maxDiscount: unknown;
  validFrom: Date;
  validUntil: Date;
  usageLimit: number | null;
  usageCount: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}): OfferResponse {
  return {
    id: offer.id,
    code: offer.code,
    titleHi: offer.titleHi,
    titleEn: offer.titleEn,
    descriptionHi: offer.descriptionHi,
    descriptionEn: offer.descriptionEn,
    discountType: offer.discountType as DiscountType,
    discountValue: decimalToNumber(offer.discountValue),
    minOrder: decimalToNumberOrNull(offer.minOrder),
    maxDiscount: decimalToNumberOrNull(offer.maxDiscount),
    validFrom: offer.validFrom.toISOString(),
    validUntil: offer.validUntil.toISOString(),
    usageLimit: offer.usageLimit,
    usageCount: offer.usageCount,
    isActive: offer.isActive,
    createdAt: offer.createdAt.toISOString(),
    updatedAt: offer.updatedAt.toISOString(),
  };
}

/** Map Prisma OfferService (with service) to API response */
function mapOfferServiceToResponse(os: {
  id: string;
  serviceId: string;
  service: { nameHi: string; nameEn: string; price: unknown; durationMinutes: number };
}): OfferServiceItemResponse {
  return {
    id: os.id,
    serviceId: os.serviceId,
    nameHi: os.service.nameHi,
    nameEn: os.service.nameEn,
    price: decimalToNumber(os.service.price),
    durationMinutes: os.service.durationMinutes,
  };
}

// ==================== LIST OFFERS ====================

/**
 * List offers with filtering and pagination
 * Public: only active, currently valid offers
 * Admin: all offers with filters
 */
export async function listOffers(
  query: OfferListQuery,
  isAdmin: boolean
): Promise<OfferListResponse> {
  const { isActive, includeExpired = false, page = 1, limit = 20 } = query;

  const where: Prisma.OfferWhereInput = {};

  if (isAdmin) {
    // Admin can see all offers, with optional filters
    if (isActive !== undefined) {
      where.isActive = isActive;
    }
    if (!includeExpired) {
      where.validUntil = { gte: new Date() };
    }
  } else {
    // Public: only active, currently valid offers
    where.isActive = true;
    where.validFrom = { lte: new Date() };
    where.validUntil = { gte: new Date() };
  }

  // Pagination
  const skip = (page - 1) * limit;
  const take = limit;

  const [offers, total] = await Promise.all([
    prisma.offer.findMany({
      where,
      orderBy: [{ validUntil: "asc" }, { createdAt: "desc" }],
      skip,
      take,
    }),
    prisma.offer.count({ where }),
  ]);

  return {
    offers: offers.map(mapOfferToResponse),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

// ==================== GET OFFER DETAIL ====================

/**
 * Get single offer with linked services
 * Public endpoint — no auth required
 */
export async function getOfferById(id: string): Promise<OfferDetailResponse> {
  const offer = await prisma.offer.findUnique({
    where: { id },
    include: {
      offerServices: {
        include: {
          service: {
            select: {
              id: true,
              nameHi: true,
              nameEn: true,
              price: true,
              durationMinutes: true,
            },
          },
        },
        orderBy: { service: { nameEn: "asc" } },
      },
    },
  });

  if (!offer) {
    throw new OfferNotFoundError();
  }

  const { offerServices, ...offerData } = offer;

  return {
    ...mapOfferToResponse(offerData),
    services: offerServices.map(mapOfferServiceToResponse),
  };
}

// ==================== CREATE OFFER ====================

/**
 * Create a new offer
 * Admin only
 * Code is auto-uppercased by Zod transform
 */
export async function createOffer(data: CreateOfferInput): Promise<OfferDetailResponse> {
  // Check if code already exists
  const existing = await prisma.offer.findUnique({
    where: { code: data.code },
  });

  if (existing) {
    throw new OfferCodeExistsError();
  }

  // Validate serviceIds if provided
  if (data.serviceIds && data.serviceIds.length > 0) {
    const services = await prisma.service.findMany({
      where: { id: { in: data.serviceIds } },
      select: { id: true },
    });
    const validServiceIds = new Set(services.map((s) => s.id));
    const invalidIds = data.serviceIds.filter((id) => !validServiceIds.has(id));
    if (invalidIds.length > 0) {
      throw new ServiceNotFoundError();
    }
  }

  try {
    const offer = await prisma.offer.create({
      data: {
        code: data.code,
        titleHi: data.titleHi,
        titleEn: data.titleEn ?? null,
        descriptionHi: data.descriptionHi ?? null,
        descriptionEn: data.descriptionEn ?? null,
        discountType: data.discountType,
        discountValue: data.discountValue,
        minOrder: data.minOrder ?? null,
        maxDiscount: data.maxDiscount ?? null,
        validFrom: new Date(data.validFrom),
        validUntil: new Date(data.validUntil),
        usageLimit: data.usageLimit ?? null,
        offerServices: data.serviceIds && data.serviceIds.length > 0
          ? {
              create: data.serviceIds.map((serviceId) => ({ serviceId })),
            }
          : undefined,
      },
      include: {
        offerServices: {
          include: {
            service: {
              select: {
                id: true,
                nameHi: true,
                nameEn: true,
                price: true,
                durationMinutes: true,
              },
            },
          },
          orderBy: { service: { nameEn: "asc" } },
        },
      },
    });

    const { offerServices, ...offerData } = offer;

    return {
      ...mapOfferToResponse(offerData),
      services: offerServices.map(mapOfferServiceToResponse),
    };
  } catch (error) {
    // Handle unique constraint on code
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw new OfferCodeExistsError();
    }
    throw error;
  }
}

// ==================== UPDATE OFFER ====================

/**
 * Update an existing offer (partial update)
 * Admin only
 * Code is immutable — cannot be changed after creation
 */
export async function updateOffer(id: string, data: UpdateOfferInput): Promise<OfferDetailResponse> {
  // Verify offer exists
  const existing = await prisma.offer.findUnique({ where: { id } });
  if (!existing) {
    throw new OfferNotFoundError();
  }

  // Reject code change attempts
  if (data.code !== undefined) {
    throw new OfferCodeImmutableError();
  }

  // Build update data — only include fields that were provided
  const updateData: Prisma.OfferUpdateInput = {};

  if (data.titleHi !== undefined) updateData.titleHi = data.titleHi;
  if (data.titleEn !== undefined) updateData.titleEn = data.titleEn ?? null;
  if (data.descriptionHi !== undefined) updateData.descriptionHi = data.descriptionHi ?? null;
  if (data.descriptionEn !== undefined) updateData.descriptionEn = data.descriptionEn ?? null;
  if (data.discountType !== undefined) updateData.discountType = data.discountType;
  if (data.discountValue !== undefined) updateData.discountValue = data.discountValue;
  if (data.minOrder !== undefined) updateData.minOrder = data.minOrder;
  if (data.maxDiscount !== undefined) updateData.maxDiscount = data.maxDiscount;
  if (data.validFrom !== undefined) updateData.validFrom = new Date(data.validFrom);
  if (data.validUntil !== undefined) updateData.validUntil = new Date(data.validUntil);
  if (data.usageLimit !== undefined) updateData.usageLimit = data.usageLimit;
  if (data.isActive !== undefined) updateData.isActive = data.isActive;

  const offer = await prisma.offer.update({
    where: { id },
    data: updateData,
    include: {
      offerServices: {
        include: {
          service: {
            select: {
              id: true,
              nameHi: true,
              nameEn: true,
              price: true,
              durationMinutes: true,
            },
          },
        },
        orderBy: { service: { nameEn: "asc" } },
      },
    },
  });

  const { offerServices, ...offerData } = offer;

  return {
    ...mapOfferToResponse(offerData),
    services: offerServices.map(mapOfferServiceToResponse),
  };
}

// ==================== DEACTIVATE OFFER (SOFT DELETE) ====================

/**
 * Soft delete — sets isActive = false
 * Admin only
 */
export async function deactivateOffer(id: string): Promise<OfferResponse> {
  const existing = await prisma.offer.findUnique({ where: { id } });
  if (!existing) {
    throw new OfferNotFoundError();
  }

  if (!existing.isActive) {
    // Already inactive — still return the offer but inform via response
  }

  const offer = await prisma.offer.update({
    where: { id },
    data: { isActive: false },
  });

  return mapOfferToResponse(offer);
}

// ==================== OFFER SERVICES ====================

/**
 * List services linked to an offer
 * Public endpoint
 */
export async function listOfferServices(offerId: string): Promise<OfferServiceItemResponse[]> {
  // Verify offer exists
  const offer = await prisma.offer.findUnique({ where: { id: offerId } });
  if (!offer) {
    throw new OfferNotFoundError();
  }

  const offerServices = await prisma.offerService.findMany({
    where: { offerId },
    include: {
      service: {
        select: {
          id: true,
          nameHi: true,
          nameEn: true,
          price: true,
          durationMinutes: true,
        },
      },
    },
    orderBy: { service: { nameEn: "asc" } },
  });

  return offerServices.map(mapOfferServiceToResponse);
}

/**
 * Bulk link services to an offer
 * Admin only
 * Skips already-linked services gracefully (no error on duplicates)
 */
export async function linkServices(
  offerId: string,
  serviceIds: string[]
): Promise<BulkLinkServicesResult> {
  // Verify offer exists
  const offer = await prisma.offer.findUnique({ where: { id: offerId } });
  if (!offer) {
    throw new OfferNotFoundError();
  }

  // Verify all services exist
  const services = await prisma.service.findMany({
    where: { id: { in: serviceIds } },
    select: { id: true },
  });

  const validServiceIds = new Set(services.map((s) => s.id));
  const invalidServiceIds = serviceIds.filter((id) => !validServiceIds.has(id));

  if (invalidServiceIds.length > 0) {
    throw new ServiceNotFoundError();
  }

  // Find already-linked services
  const existingLinks = await prisma.offerService.findMany({
    where: {
      offerId,
      serviceId: { in: serviceIds },
    },
    select: { serviceId: true },
  });

  const alreadyLinked = new Set(existingLinks.map((l) => l.serviceId));

  // Filter out already-linked services
  const newServiceIds = serviceIds.filter((id) => !alreadyLinked.has(id));

  // Bulk create new links
  if (newServiceIds.length > 0) {
    await prisma.offerService.createMany({
      data: newServiceIds.map((serviceId) => ({
        offerId,
        serviceId,
      })),
      skipDuplicates: true, // Extra safety for concurrent requests
    });
  }

  return {
    linked: newServiceIds.length,
    skipped: alreadyLinked.size,
    total: serviceIds.length,
  };
}

/**
 * Unlink a service from an offer
 * Admin only
 */
export async function unlinkService(
  offerId: string,
  serviceId: string
): Promise<{ deleted: boolean }> {
  // Verify the link exists
  const link = await prisma.offerService.findFirst({
    where: { offerId, serviceId },
  });

  if (!link) {
    throw new OfferServiceLinkNotFoundError();
  }

  await prisma.offerService.delete({
    where: { id: link.id },
  });

  return { deleted: true };
}

// ==================== VALIDATE OFFER ====================

/**
 * Validate a promo code and calculate discount
 * Authenticated users only
 * Full validation chain: exists → active → dates → usage → minOrder → service applicable → calculate discount
 * Returns: offer details + calculated discount + isApplicable
 */
export async function validateOfferCode(
  code: string,
  serviceId: string,
  bookingAmount: number,
  userId: string
): Promise<OfferValidationResponse> {
  // Find offer by code
  const offer = await prisma.offer.findUnique({
    where: { code: code.toUpperCase() },
    select: {
      id: true,
      code: true,
      titleHi: true,
      titleEn: true,
      descriptionHi: true,
      descriptionEn: true,
      discountType: true,
      discountValue: true,
      maxDiscount: true,
      minOrder: true,
      usageLimit: true,
      usageCount: true,
      isActive: true,
      validFrom: true,
      validUntil: true,
      offerServices: {
        select: { serviceId: true },
      },
    },
  });

  // Offer not found
  if (!offer) {
    throw new OfferNotFoundError();
  }

  // Not active
  if (!offer.isActive) {
    throw new OfferNotFoundError(); // Don't reveal inactive offer details
  }

  // Check date validity
  const now = new Date();
  if (now > offer.validUntil) {
    throw new OfferExpiredError();
  }
  if (now < offer.validFrom) {
    throw new OfferNotYetActiveError();
  }

  // Check usage limit
  if (offer.usageLimit !== null && offer.usageCount >= offer.usageLimit) {
    throw new OfferUsageLimitReachedError();
  }

  // Check min order
  if (offer.minOrder !== null && new Prisma.Decimal(bookingAmount) < offer.minOrder) {
    throw new OfferMinOrderNotMetError();
  }

  // Check if offer is applicable to this service
  // If offer has specific service restrictions, check them
  if (offer.offerServices.length > 0) {
    const isApplicable = offer.offerServices.some((os) => os.serviceId === serviceId);
    if (!isApplicable) {
      throw new OfferNotApplicableError();
    }
  }

  // Calculate discount
  let discountAmount: Prisma.Decimal;
  if (offer.discountType === "PERCENTAGE") {
    discountAmount = new Prisma.Decimal(bookingAmount).mul(offer.discountValue).div(100);
  } else {
    // FLAT_AMOUNT
    discountAmount = offer.discountValue;
  }

  // Apply max discount cap
  if (offer.maxDiscount !== null) {
    discountAmount = Prisma.Decimal.min(discountAmount, offer.maxDiscount);
  }

  // Discount cannot exceed booking amount
  discountAmount = Prisma.Decimal.min(discountAmount, new Prisma.Decimal(bookingAmount));

  const finalAmount = new Prisma.Decimal(bookingAmount).sub(discountAmount);

  return {
    isApplicable: true,
    offer: {
      id: offer.id,
      code: offer.code,
      titleHi: offer.titleHi,
      titleEn: offer.titleEn,
      discountType: offer.discountType as DiscountType,
      discountValue: decimalToNumber(offer.discountValue),
      minOrder: decimalToNumberOrNull(offer.minOrder),
      maxDiscount: decimalToNumberOrNull(offer.maxDiscount),
      validFrom: offer.validFrom.toISOString(),
      validUntil: offer.validUntil.toISOString(),
      usageLimit: offer.usageLimit,
      usageCount: offer.usageCount,
    },
    discountAmount: decimalToNumber(discountAmount),
    finalAmount: decimalToNumber(finalAmount),
  };
}
