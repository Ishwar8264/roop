/**
 * Purpose: Staff portfolio API endpoints
 * Responsibility: List staff portfolio (public), add portfolio item (admin), remove portfolio item (admin)
 *
 * Endpoints:
 *   GET    /api/staff/[id]/portfolio  — List portfolio items for a specific staff member (public)
 *   POST   /api/staff/[id]/portfolio  — Add a portfolio item for a staff member (admin only)
 *   DELETE /api/staff/[id]/portfolio   — Remove a portfolio item by query param itemId (admin only)
 *
 * GET Response:
 *   200: { success: true, data: { items, staff } }
 *
 * POST Request Body:
 *   imageUrl, titleHi (opt), titleEn (opt), isFeatured (opt, default false)
 *
 * DELETE Query Params:
 *   itemId — ID of the portfolio item to delete
 *
 * Error Responses:
 *   403: { success: false, error: "PERM_ADMIN_REQUIRED" }
 *   404: { success: false, error: "RES_NOT_FOUND" }
 */

import { createApiHandler } from "@/lib/api-handler";
import { prisma } from "@/lib/prisma";
import { requireActiveUser } from "@/lib/auth-helpers";
import { NotFoundError, AdminRequiredError } from "@/lib/errors";
import { HTTP_STATUS } from "@/lib/http";
import { addPortfolioItemSchema } from "@/lib/validations/portfolio";

// ==================== Helper — extract [id] from URL ====================

function extractStaffIdFromUrl(request: Request): string | null {
  const url = new URL(request.url);
  const segments = url.pathname.split("/");
  const idIndex = segments.indexOf("staff") + 1;
  return segments[idIndex] || null;
}

// ==================== GET — Staff Portfolio (Public) ====================

export const GET = createApiHandler({
  schema: null,
  handler: async ({ request }) => {
    const staffId = extractStaffIdFromUrl(request);
    if (!staffId) {
      throw new NotFoundError("Staff not found");
    }

    // 1. Verify staff exists
    const staff = await prisma.staff.findUnique({
      where: { id: staffId },
      select: {
        id: true,
        bioHi: true,
        bioEn: true,
        photoUrl: true,
        rating: true,
        specialization: true,
        user: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
      },
    });

    if (!staff) {
      throw new NotFoundError("Staff not found");
    }

    // 2. Fetch all portfolio items for this staff
    const items = await prisma.portfolioItem.findMany({
      where: { staffId },
      orderBy: [
        { isFeatured: "desc" },
        { createdAt: "desc" },
      ],
    });

    // 3. Return with serialized decimals
    return {
      items,
      staff: {
        ...staff,
        rating: staff.rating.toString(),
      },
    };
  },
});

// ==================== POST — Add Portfolio Item (Admin) ====================

export const POST = createApiHandler({
  schema: addPortfolioItemSchema,
  successMessage: "Portfolio item added successfully",
  successStatus: HTTP_STATUS.CREATED,
  handler: async ({ parsedBody, request }) => {
    const staffId = extractStaffIdFromUrl(request);
    if (!staffId) {
      throw new NotFoundError("Staff not found");
    }

    // 1. Verify admin access
    const { user } = await requireActiveUser(request);
    if (user.role !== "ADMIN") {
      throw new AdminRequiredError();
    }

    // 2. Verify staff exists
    const staff = await prisma.staff.findUnique({
      where: { id: staffId },
    });
    if (!staff) {
      throw new NotFoundError("Staff not found");
    }

    // 3. Create portfolio item
    const { imageUrl, titleHi, titleEn, isFeatured } = parsedBody;

    const newItem = await prisma.portfolioItem.create({
      data: {
        staffId,
        imageUrl,
        titleHi: titleHi || null,
        titleEn: titleEn || null,
        isFeatured,
      },
    });

    return newItem;
  },
});

// ==================== DELETE — Remove Portfolio Item (Admin) ====================

export const DELETE = createApiHandler({
  schema: null,
  successMessage: "Portfolio item removed successfully",
  handler: async ({ request }) => {
    const staffId = extractStaffIdFromUrl(request);
    if (!staffId) {
      throw new NotFoundError("Staff not found");
    }

    // 1. Verify admin access
    const { user } = await requireActiveUser(request);
    if (user.role !== "ADMIN") {
      throw new AdminRequiredError();
    }

    // 2. Extract itemId from query params
    const url = new URL(request.url);
    const itemId = url.searchParams.get("itemId");
    if (!itemId) {
      throw new NotFoundError("Portfolio item ID (itemId) is required as a query parameter");
    }

    // 3. Verify portfolio item exists and belongs to this staff
    const item = await prisma.portfolioItem.findUnique({
      where: { id: itemId },
    });
    if (!item) {
      throw new NotFoundError("Portfolio item not found");
    }
    if (item.staffId !== staffId) {
      throw new NotFoundError("Portfolio item does not belong to this staff member");
    }

    // 4. Delete the portfolio item
    await prisma.portfolioItem.delete({
      where: { id: itemId },
    });

    return null;
  },
});
