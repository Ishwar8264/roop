/**
 * Purpose: Change phone number — Step 2: Verify OTP and update phone
 * Endpoint: POST /api/user/change-phone/verify
 *
 * Flow:
 *   1. Require auth (requireAuthWithSession)
 *   2. Validate with verifyChangePhoneSchema (newPhone + otp)
 *   3. Check Redis for pending phone change
 *   4. Verify OTP using verifyStoredOtp()
 *   5. Update user's phone, set phoneVerified = true
 *   6. Delete Redis key
 *   7. Return updated user
 */

import { createApiHandler } from "@/lib/server/api-handler";
import { prisma } from "@/lib/database/prisma";
import { redis } from "@/lib/config/redis";
import { requireAuthWithSession, getUserWithProviders } from "@/features/auth/services/session-service";
import { verifyStoredOtp } from "@/features/auth/services/otp-service";
import { verifyChangePhoneSchema } from "@/features/user/validations/user";
import { ValidationError } from "@/lib/server/errors";
import type { VerifyChangePhoneInput } from "@/features/user/validations/user";

const PHONE_CHANGE_REDIS_PREFIX = "phone_change:";

export const POST = createApiHandler<
  VerifyChangePhoneInput,
  Record<string, unknown>
>({
  schema: verifyChangePhoneSchema,
  handler: async ({ parsedBody, request }) => {
    // 1. Require authenticated user with valid session
    const { user } = await requireAuthWithSession(request);

    const { newPhone, otp } = parsedBody;

    // 2. Check Redis for pending phone change
    const redisKey = `${PHONE_CHANGE_REDIS_PREFIX}${user.id}`;
    const pendingPhone = await redis.get(redisKey);

    if (!pendingPhone) {
      throw new ValidationError(
        "No pending phone change found. Please request a new OTP."
      );
    }

    if (pendingPhone !== newPhone) {
      throw new ValidationError(
        "Phone number does not match the pending change request."
      );
    }

    // 3. Verify OTP using verifyStoredOtp()
    await verifyStoredOtp(newPhone, otp);

    // 4. Update user's phone + delete Redis key (parallel — independent operations)
    await Promise.all([
      prisma.user.update({
        where: { id: user.id },
        data: {
          phone: newPhone,
          phoneVerified: true,
        },
      }),
      redis.del(redisKey),
    ]);

    // 5. Return updated user with providers
    const updatedUser = await getUserWithProviders(user.id);

    return updatedUser as Record<string, unknown>;
  },
  successMessage: "Phone number updated successfully.",
});
