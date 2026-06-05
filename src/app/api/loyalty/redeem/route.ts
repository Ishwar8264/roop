/**
 * Purpose: Loyalty points redemption API endpoint
 * Responsibility: Redeem loyalty points for discount (auth required)
 *
 * Endpoint:
 *   POST /api/loyalty/redeem — Redeem points (auth required)
 *
 * POST Request Body:
 *   points    (required) — Number of points to redeem (positive integer)
 *   bookingId (optional) — Booking to apply discount to
 *   reason    (required) — Reason for redemption
 *
 * Redemption Logic:
 *   - Check user has enough points
 *   - Deduct points from user.loyaltyPoints
 *   - Create LoyaltyTransaction record with type REDEEM
 *   - Points value: typically 1 point = ₹1 (configurable)
 *
 * Response:
 *   200: { success: true, data: { transaction, newBalance }, message }
 *   400: { success: false, error, message }
 *   401: { success: false, error: "AUTH_MISSING_TOKEN" }
 */

import { createApiHandler } from "@/lib/api-handler";
import { prisma } from "@/lib/prisma";
import { requireActiveUser } from "@/lib/auth-helpers";
import { ValidationError, NotFoundError } from "@/lib/errors";
import { redeemPointsSchema } from "@/lib/validations/loyalty";

// ==================== POST — Redeem Points (Auth Required) ====================

export const POST = createApiHandler({
  schema: redeemPointsSchema,
  successMessage: "Points redeemed successfully",
  handler: async ({ parsedBody, request }) => {
    const { points, bookingId, reason } = parsedBody;

    // 1. Verify authenticated user
    const { user } = await requireActiveUser(request);

    // 2. Check user has enough points
    if (user.loyaltyPoints < points) {
      throw new ValidationError(
        `Insufficient points. You have ${user.loyaltyPoints} points, but requested ${points}`
      );
    }

    // 3. Validate bookingId if provided
    if (bookingId) {
      const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
      });
      if (!booking) {
        throw new NotFoundError("Booking not found");
      }
      if (booking.userId !== user.id) {
        throw new NotFoundError("Booking not found");
      }
    }

    // 4. Create LoyaltyTransaction record and deduct points (parallel)
    const [transaction, updatedUser] = await Promise.all([
      prisma.loyaltyTransaction.create({
        data: {
          userId: user.id,
          type: "REDEEM",
          points: -points, // Negative for redemption
          bookingId: bookingId || null,
          reason,
        },
      }),
      prisma.user.update({
        where: { id: user.id },
        data: {
          loyaltyPoints: {
            decrement: points,
          },
        },
      }),
    ]);

    // 6. Return transaction and new balance
    return {
      transaction,
      newBalance: updatedUser.loyaltyPoints,
    };
  },
});
