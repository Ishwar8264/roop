/**
 * Purpose: Customer Addresses list and create API endpoints
 * Responsibility: List user's saved addresses + create new address
 *
 * Endpoints:
 *   GET  /api/addresses  — List user's saved addresses
 *   POST /api/addresses  — Create a new address
 *
 * Auth: Any authenticated user (own addresses only)
 */

import { createApiHandler } from "@/lib/api-handler";
import { prisma } from "@/lib/prisma";
import { requireActiveUser } from "@/lib/auth-helpers";
import { HTTP_STATUS } from "@/lib/http";
import { createAddressSchema } from "@/lib/validations/addresses";

// ==================== GET — LIST ADDRESSES ====================

export const GET = createApiHandler({
  schema: null,
  handler: async ({ request }) => {
    const { user } = await requireActiveUser(request);

    const addresses = await prisma.customerAddress.findMany({
      where: { userId: user.id },
      orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
    });

    return { addresses };
  },
});

// ==================== POST — CREATE ADDRESS ====================

export const POST = createApiHandler({
  schema: createAddressSchema,
  successMessage: "Address added successfully.",
  successStatus: HTTP_STATUS.CREATED,
  handler: async ({ parsedBody, request }) => {
    const { user } = await requireActiveUser(request);
    const { label, address, city, pincode, landmark, isDefault } = parsedBody;

    // If isDefault is true, unset any existing default
    if (isDefault) {
      await prisma.customerAddress.updateMany({
        where: { userId: user.id, isDefault: true },
        data: { isDefault: false },
      });
    }

    // Check max addresses per user (limit: 5)
    const currentCount = await prisma.customerAddress.count({
      where: { userId: user.id },
    });

    if (currentCount >= 5) {
      return Response.json(
        {
          success: false,
          error: "VAL_INVALID_INPUT",
          message: "Maximum 5 addresses allowed per user.",
          statusCode: HTTP_STATUS.BAD_REQUEST,
        },
        { status: HTTP_STATUS.BAD_REQUEST }
      );
    }

    // If this is the first address, make it default automatically
    const shouldBeDefault = currentCount === 0 ? true : isDefault;

    const newAddress = await prisma.customerAddress.create({
      data: {
        userId: user.id,
        label,
        address,
        city,
        pincode,
        landmark: landmark || null,
        isDefault: shouldBeDefault,
      },
    });

    return newAddress;
  },
});
