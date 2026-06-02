/**
 * Purpose: Send OTP to phone number
 * Endpoint: POST /api/auth/send-otp
 *
 * Flow:
 * 1. Validate phone number
 * 2. Rate limit check (Redis)
 * 3. Generate + hash OTP, store in Redis
 * 4. Send via SMS (stubbed)
 * 5. Log audit event
 */

import { createApiHandler } from "@/lib/server/api-handler";
import { storeOtp } from "@/features/auth/services/otp-service";
import { logAuthEvent } from "@/features/auth/services/auth-event-service";
import { sendOtpSchema } from "@/features/auth/validations/auth";
import { extractClientIp } from "@/lib/server/device";

export const POST = createApiHandler({
  schema: sendOtpSchema,
  successMessage: "OTP sent successfully.",
  handler: async ({ parsedBody, request }) => {
    const { phone } = parsedBody;
    const ip = extractClientIp(request);

    // Store OTP in Redis (includes rate limiting)
    const { expiresIn } = await storeOtp(phone, ip);

    // SMS sending is stubbed — integrate real gateway in production
    // The OTP value is returned by storeOtp but NEVER included in API response
    console.log(`[OTP STUB] OTP sent to ${phone.slice(0, 2)}****${phone.slice(6)}`);

    // Log audit event
    await logAuthEvent("OTP_SENT", request, {
      identifier: phone,
      metadata: { purpose: "LOGIN" },
    });

    return { phone, expiresIn };
  },
});
