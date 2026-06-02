/**
 * Purpose: Change phone number — Step 1: Send OTP to new number
 * Endpoint: POST /api/user/change-phone
 *
 * Flow:
 *   1. Require auth (requireAuthWithSession)
 *   2. Validate with changePhoneSchema (newPhone)
 *   3. Check newPhone isn't already used by another user
 *   4. Send OTP to new phone using storeOtp() (handles rate limiting)
 *   5. Store pending phone change in Redis key `phone_change:{userId}` with TTL = 5 min
 *   6. Return success message
 */

import { createApiHandler } from "@/lib/server/api-handler";
import { prisma } from "@/lib/database/prisma";
import { redis } from "@/lib/config/redis";
import { requireAuthWithSession } from "@/features/auth/services/session-service";
import { storeOtp } from "@/features/auth/services/otp-service";
import { changePhoneSchema } from "@/features/user/validations/user";
import { AuthPhoneTakenError } from "@/lib/server/errors";
import { extractClientIp } from "@/lib/server/device";
import type { ChangePhoneInput } from "@/features/user/validations/user";

const PHONE_CHANGE_TTL_SECONDS = 5 * 60; // 5 minutes
const PHONE_CHANGE_REDIS_PREFIX = "phone_change:";

export const POST = createApiHandler<ChangePhoneInput, { message: string }>({
  schema: changePhoneSchema,
  handler: async ({ parsedBody, request }) => {
    // 1. Require authenticated user with valid session
    const { user } = await requireAuthWithSession(request);

    const { newPhone } = parsedBody;

    // 2. Check newPhone isn't already used by another user
    const existingUser = await prisma.user.findFirst({
      where: {
        phone: newPhone,
        NOT: { id: user.id },
      },
      select: { id: true },
    });

    if (existingUser) {
      throw new AuthPhoneTakenError();
    }

    // 3. Send OTP to new phone using storeOtp() — handles rate limiting
    const ip = extractClientIp(request);
    await storeOtp(newPhone, ip);

    // 4. Store pending phone change in Redis
    const redisKey = `${PHONE_CHANGE_REDIS_PREFIX}${user.id}`;
    await redis.setex(redisKey, PHONE_CHANGE_TTL_SECONDS, newPhone);

    return { message: "OTP sent to new phone number." };
  },
  successMessage: "OTP sent to new phone number.",
});
