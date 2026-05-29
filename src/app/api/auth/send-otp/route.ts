/**
 * Purpose: Send OTP API endpoint for Nikharta Roop auth
 * Responsibility: Validate mobile, rate limit, generate OTP, hash and store, send via SMS
 * Important Notes:
 *   - POST /api/auth/send-otp
 *   - Uses createApiHandler for standardized error handling and validation
 *   - All error messages come from centralized HTTP_MESSAGES
 *   - All error classes come from centralized errors.ts
 */

import { createApiHandler } from "@/lib/api-handler";
import { prisma } from "@/lib/prisma";
import {
  generateOtp,
  hashOtp,
  checkRateLimit,
  recordOtpSent,
  getOtpExpiry,
  sendOtpSms,
} from "@/lib/otp";
import { sendOtpSchema } from "@/lib/validations/auth";
import { HTTP_MESSAGES } from "@/lib/http";
import {
  AuthOtpAlreadySentError,
  AuthHourlyLimitError,
  AuthSmsFailedError,
} from "@/lib/errors";

export const POST = createApiHandler({
  schema: sendOtpSchema,
  successMessage: HTTP_MESSAGES.AUTH_OTP_SENT_SUCCESS.messageEn,
  handler: async ({ parsedBody, request }) => {
    const { mobile } = parsedBody;

    // 1. Check rate limiting — prevent OTP spam
    const rateLimitResult = checkRateLimit(mobile);
    if (!rateLimitResult.allowed) {
      if (rateLimitResult.reason === "OTP_ALREADY_SENT") {
        throw new AuthOtpAlreadySentError(rateLimitResult.retryAfterSeconds);
      }
      throw new AuthHourlyLimitError(rateLimitResult.retryAfterSeconds);
    }

    // 2. Invalidate any existing unused OTPs for this mobile
    await prisma.authOtp.updateMany({
      where: {
        mobile,
        isUsed: false,
        expiresAt: { gt: new Date() },
      },
      data: { isUsed: true },
    });

    // 3. Generate new OTP
    const plainOtp = generateOtp();
    const hashedOtp = await hashOtp(plainOtp);
    const expiresAt = getOtpExpiry();

    // 4. Store hashed OTP in database
    await prisma.authOtp.create({
      data: {
        mobile,
        otp: hashedOtp,
        purpose: "LOGIN",
        attempts: 0,
        isUsed: false,
        expiresAt,
      },
    });

    // 5. Send OTP via SMS (currently stubbed)
    const smsResult = await sendOtpSms(mobile, plainOtp, "LOGIN");
    if (!smsResult.success) {
      throw new AuthSmsFailedError();
    }

    // 6. Record rate limit entry AFTER successful send
    recordOtpSent(mobile);

    // 7. Log auth event for audit trail
    await prisma.authEvent.create({
      data: {
        mobile,
        event: "OTP_SENT",
        ip: request.headers.get("x-forwarded-for") || null,
        device: request.headers.get("user-agent") || null,
        metadata: { purpose: "LOGIN" },
      },
    });

    // 8. Return data — NEVER include OTP in response
    return {
      mobile,
      expiresIn: 300, // 5 minutes in seconds
      messageId: smsResult.messageId,
    };
  },
});
