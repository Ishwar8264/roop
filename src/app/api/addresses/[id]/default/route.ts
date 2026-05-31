/**
 * Purpose: Set address as default
 * Responsibility: Mark an address as the user's default address
 *
 * Endpoint: PATCH /api/addresses/[id]/default
 * Auth: Any authenticated user (own addresses only)
 */

import { createApiHandler } from "@/lib/api-handler";
import { prisma } from "@/lib/prisma";
import { requireActiveUser } from "@/lib/auth-helpers";
import { NotFoundError, ForbiddenError } from "@/lib/errors";

export const PATCH = createApiHandler({
  schema: null,
  successMessage: "Default address updated successfully.",
  handler: async ({ request }) => {
    const { user } = await requireActiveUser(request);

    // Extract address ID from URL
    const url = new URL(request.url);
    const pathParts = url.pathname.split("/");
    const addressId = pathParts[3]; // /api/addresses/[id]/default

    // Verify address exists and belongs to user
    const address = await prisma.customerAddress.findUnique({
      where: { id: addressId },
    });

    if (!address) {
      throw new NotFoundError("Address not found.");
    }

    if (address.userId !== user.id) {
      throw new ForbiddenError("You can only modify your own addresses.");
    }

    // Unset current default + set new default in a transaction
    await prisma.$transaction([
      prisma.customerAddress.updateMany({
        where: { userId: user.id, isDefault: true },
        data: { isDefault: false },
      }),
      prisma.customerAddress.update({
        where: { id: addressId },
        data: { isDefault: true },
      }),
    ]);

    return { id: addressId, isDefault: true };
  },
});
