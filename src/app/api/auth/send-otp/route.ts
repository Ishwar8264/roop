/**
 * Purpose: Send OTP API endpoint for Nikharta Roop auth
 * Responsibility: Validate mobile, rate limit, generate OTP, hash and store, send via SMS
 *
 * Endpoint: POST /api/auth/send-otp
 *
 * OpenAPI Summary: Send OTP to mobile number
 * OpenAPI Description: Generate and send a 6-digit OTP to the given mobile number via SMS.
 *   Rate limited: 1 request per 30 seconds, 5 per hour per mobile.
 *   Previous unused OTPs are automatically invalidated.
 *
 * Request Body:
 *   mobile: string (Indian 10-digit, starts with 6-9) — required
 *
 * Responses:
 *   200: { success: true, data: { mobile, expiresIn, messageId }, message }
 *   400: { success: false, error: "VAL_INVALID_INPUT", message, statusCode: 400 }
 *   429: { success: false, error: "AUTH_OTP_ALREADY_SENT"|"AUTH_HOURLY_LIMIT", message, statusCode: 429, retryAfterSeconds }
 *   500: { success: false, error: "SYS_SMS_FAILED", message, statusCode: 500 }
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
import { logAuthEvent } from "@/lib/auth-helpers";
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
    // Check if user exists to link userId
    const existingUser = await prisma.user.findUnique({ where: { mobile } });

    await prisma.authOtp.create({
      data: {
        userId: existingUser?.id || null,
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
    await logAuthEvent(mobile, "OTP_SENT", request, { purpose: "LOGIN" });

    // 8. Return data — NEVER include OTP in response
    return {
      mobile,
      expiresIn: 300, // 5 minutes in seconds
      messageId: smsResult.messageId,
    };
  },
});
