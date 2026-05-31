/**
 * Purpose: Customer Address detail, update, delete, and set-default endpoints
 * Responsibility: Single address operations
 *
 * Endpoints:
 *   GET    /api/addresses/[id]           — Get address detail
 *   PATCH  /api/addresses/[id]           — Update address
 *   DELETE /api/addresses/[id]           — Delete address
 *   PATCH  /api/addresses/[id]/default   — Set as default address
 *
 * Auth: Any authenticated user (own addresses only)
 */

import { createApiHandler } from "@/lib/api-handler";
import { prisma } from "@/lib/prisma";
import { requireActiveUser } from "@/lib/auth-helpers";
import { NotFoundError, ForbiddenError } from "@/lib/errors";
import { HTTP_STATUS } from "@/lib/http";
import { updateAddressSchema } from "@/lib/validations/addresses";

// Helper: Get address ID from URL
function getAddressId(request: Request): string {
  const url = new URL(request.url);
  const pathParts = url.pathname.split("/");
  return pathParts[3]; // /api/addresses/[id]/...
}

// Helper: Verify address belongs to user
async function verifyOwnership(addressId: string, userId: string) {
  const address = await prisma.customerAddress.findUnique({
    where: { id: addressId },
  });

  if (!address) {
    throw new NotFoundError("Address not found.");
  }

  if (address.userId !== userId) {
    throw new ForbiddenError("You can only access your own addresses.");
  }

  return address;
}

// ==================== GET — ADDRESS DETAIL ====================

export const GET = createApiHandler({
  schema: null,
  handler: async ({ request }) => {
    const { user } = await requireActiveUser(request);
    const addressId = getAddressId(request);

    const address = await verifyOwnership(addressId, user.id);
    return address;
  },
});

// ==================== PATCH — UPDATE ADDRESS ====================

export const PATCH = createApiHandler({
  schema: updateAddressSchema,
  successMessage: "Address updated successfully.",
  handler: async ({ parsedBody, request }) => {
    const { user } = await requireActiveUser(request);
    const addressId = getAddressId(request);

    await verifyOwnership(addressId, user.id);

    const updated = await prisma.customerAddress.update({
      where: { id: addressId },
      data: parsedBody,
    });

    return updated;
  },
});

// ==================== DELETE — DELETE ADDRESS ====================

export const DELETE = createApiHandler({
  schema: null,
  successMessage: "Address deleted successfully.",
  handler: async ({ request }) => {
    const { user } = await requireActiveUser(request);
    const addressId = getAddressId(request);

    const address = await verifyOwnership(addressId, user.id);

    // Delete the address
    await prisma.customerAddress.delete({
      where: { id: addressId },
    });

    // If deleted address was default, set the most recent one as default
    if (address.isDefault) {
      const remaining = await prisma.customerAddress.findFirst({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
      });

      if (remaining) {
        await prisma.customerAddress.update({
          where: { id: remaining.id },
          data: { isDefault: true },
        });
      }
    }

    return { deleted: true };
  },
});
