/**
 * Purpose: Offers list and create API endpoints
 * Responsibility: List active offers (public) and create new offers (admin)
 *
 * Endpoints:
 *   GET  /api/offers        — List offers with pagination (public, active only by default)
 *   POST /api/offers        — Create a new offer (admin only)
 *
 * GET Query Params:
 *   isActive  (optional) — Filter by active status ("true"/"false")
 *   page      (default 1) — Page number
 *   pageSize  (default 20, max 100) — Items per page
 *
 * POST Request Body:
 *   code, titleHi, titleEn (opt), descriptionHi (opt), descriptionEn (opt),
 *   discountType, discountValue, minOrder (opt), maxDiscount (opt),
 *   validFrom, validUntil, usageLimit (opt)
 *
 * Responses:
 *   200: { success: true, data: { items, pagination } }
 *   201: { success: true, data: offer, message }
 *   400: { success: false, error, message }
 *   403: { success: false, error: "PERM_ADMIN_REQUIRED", message }
 *   409: { success: false, error: "RES_CONFLICT", message }
 */

import { createApiHandler } from "@/lib/api-handler";
import { prisma } from "@/lib/prisma";
import { requireActiveUser } from "@/lib/auth-helpers";
import { ConflictError, AdminRequiredError } from "@/lib/errors";
import { HTTP_STATUS } from "@/lib/http";
import {
  createOfferSchema,
  listOffersQuerySchema,
} from "@/lib/validations/offers";

// ==================== GET — List Offers (Public) ====================

export const GET = createApiHandler({
  schema: null,
  handler: async ({ request }) => {
    // 1. Parse and validate query params
    const url = new URL(request.url);
    const queryResult = listOffersQuerySchema.safeParse({
      isActive: url.searchParams.get("isActive") || undefined,
      page: url.searchParams.get("page") || undefined,
      pageSize: url.searchParams.get("pageSize") || undefined,
    });

    if (!queryResult.success) {
      const firstIssue = queryResult.error.issues[0];
      const fieldPath = firstIssue.path.join(".");
      const message = fieldPath
        ? `${fieldPath}: ${firstIssue.message}`
        : firstIssue.message;

      return Response.json(
        {
          success: false,
          error: "VAL_INVALID_INPUT",
          message,
          statusCode: HTTP_STATUS.BAD_REQUEST,
        },
        { status: HTTP_STATUS.BAD_REQUEST }
      );
    }

    const { isActive, page, pageSize } = queryResult.data;

    // 2. Build where clause — default to active only for public
    const where: Record<string, unknown> = {};
    if (isActive !== undefined) {
      where.isActive = isActive;
    } else {
      where.isActive = true;
    }

    // 3. Count total and fetch paginated offers
    const [total, offers] = await Promise.all([
      prisma.offer.count({ where }),
      prisma.offer.findMany({
        where,
        select: {
          id: true,
          code: true,
          titleHi: true,
          titleEn: true,
          descriptionHi: true,
          descriptionEn: true,
          discountType: true,
          discountValue: true,
          minOrder: true,
          maxDiscount: true,
          validFrom: true,
          validUntil: true,
          usageLimit: true,
          usageCount: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: { offerServices: true },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    // 5. Return with pagination and serialized decimals
    return {
      items: offers.map((offer) => ({
        ...offer,
        discountValue: offer.discountValue.toString(),
        minOrder: offer.minOrder?.toString() ?? null,
        maxDiscount: offer.maxDiscount?.toString() ?? null,
        servicesCount: offer._count.offerServices,
        _count: undefined,
      })),
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  },
});

// ==================== POST — Create Offer (Admin) ====================

export const POST = createApiHandler({
  schema: createOfferSchema,
  successMessage: "Offer created successfully",
  successStatus: HTTP_STATUS.CREATED,
  handler: async ({ parsedBody, request }) => {
    const {
      code,
      titleHi,
      titleEn,
      descriptionHi,
      descriptionEn,
      discountType,
      discountValue,
      minOrder,
      maxDiscount,
      validFrom,
      validUntil,
      usageLimit,
    } = parsedBody;

    // 1. Verify admin access
    const { user } = await requireActiveUser(request);
    if (user.role !== "ADMIN") {
      throw new AdminRequiredError();
    }

    // 2. Check code uniqueness
    const existingOffer = await prisma.offer.findUnique({
      where: { code },
    });
    if (existingOffer) {
      throw new ConflictError("An offer with this promo code already exists");
    }

    // 3. Create offer
    const newOffer = await prisma.offer.create({
      data: {
        code,
        titleHi,
        titleEn: titleEn || null,
        descriptionHi: descriptionHi || null,
        descriptionEn: descriptionEn || null,
        discountType,
        discountValue: parseFloat(discountValue),
        minOrder: minOrder ? parseFloat(minOrder) : null,
        maxDiscount: maxDiscount ? parseFloat(maxDiscount) : null,
        validFrom: new Date(validFrom),
        validUntil: new Date(validUntil),
        usageLimit: usageLimit || null,
      },
    });

    // 4. Return created offer with serialized decimals
    return {
      ...newOffer,
      discountValue: newOffer.discountValue.toString(),
      minOrder: newOffer.minOrder?.toString() ?? null,
      maxDiscount: newOffer.maxDiscount?.toString() ?? null,
    };
  },
});
