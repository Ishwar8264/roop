/**
 * Purpose: Send OTP API endpoint for Nikharta Roop auth
 * Responsibility: Validate mobile, check registration status, rate limit, generate OTP, send via SMS
 *
 * Endpoint: POST /api/auth/send-otp
 *
 * OpenAPI Summary: Send OTP to mobile number
 * OpenAPI Description: Generate and send a 6-digit OTP to the given mobile number via SMS.
 *   Rate limited: 1 request per 30 seconds, 5 per hour per mobile.
 *   Previous unused OTPs are automatically invalidated.
 *   For LOGIN: mobile must be registered in DB.
 *   For REGISTER: mobile must NOT be registered in DB.
 *
 * Request Body:
 *   mobile: string (Indian 10-digit, starts with 6-9) — required
 *   purpose: "LOGIN" | "REGISTER" — required (default: LOGIN)
 *
 * Responses:
 *   200: { success: true, data: { mobile, expiresIn, messageId }, message }
 *   400: { success: false, error: "VAL_INVALID_INPUT", message, statusCode: 400 }
 *   404: { success: false, error: "AUTH_MOBILE_NOT_REGISTERED", message, statusCode: 404 }
 *   409: { success: false, error: "AUTH_MOBILE_EXISTS", message, statusCode: 409 }
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
  AuthMobileNotRegisteredError,
  AuthMobileExistsError,
} from "@/lib/errors";

export const POST = createApiHandler({
  schema: sendOtpSchema,
  successMessage: HTTP_MESSAGES.AUTH_OTP_SENT_SUCCESS.messageEn,
  handler: async ({ parsedBody, request }) => {
    const { mobile, purpose } = parsedBody;

    // 1. Check registration status based on purpose
    const existingUser = await prisma.user.findUnique({ where: { mobile } });

    if (purpose === "LOGIN") {
      // LOGIN: mobile MUST be registered
      if (!existingUser) {
        throw new AuthMobileNotRegisteredError();
      }
    } else if (purpose === "REGISTER") {
      // REGISTER: mobile must NOT be registered
      if (existingUser) {
        throw new AuthMobileExistsError();
      }
    }

    // 2. Check rate limiting — prevent OTP spam
    const rateLimitResult = checkRateLimit(mobile);
    if (!rateLimitResult.allowed) {
      if (rateLimitResult.reason === "OTP_ALREADY_SENT") {
        throw new AuthOtpAlreadySentError(rateLimitResult.retryAfterSeconds);
      }
      throw new AuthHourlyLimitError(rateLimitResult.retryAfterSeconds);
    }

    // 3. Invalidate any existing unused OTPs for this mobile
    await prisma.authOtp.updateMany({
      where: {
        mobile,
        isUsed: false,
        expiresAt: { gt: new Date() },
      },
      data: { isUsed: true },
    });

    // 4. Generate new OTP
    const plainOtp = generateOtp();
    const hashedOtp = await hashOtp(plainOtp);
    const expiresAt = getOtpExpiry();

    // 5. Store hashed OTP in database
    await prisma.authOtp.create({
      data: {
        userId: existingUser?.id || null,
        mobile,
        otp: hashedOtp,
        purpose,
        attempts: 0,
        isUsed: false,
        expiresAt,
      },
    });

    // 6. Send OTP via SMS (currently stubbed)
    const smsResult = await sendOtpSms(mobile, plainOtp, purpose);
    if (!smsResult.success) {
      throw new AuthSmsFailedError();
    }

    // 7. Record rate limit entry AFTER successful send
    recordOtpSent(mobile);

    // 8. Log auth event for audit trail
    await logAuthEvent(mobile, "OTP_SENT", request, { purpose });

    // 9. Return data
    // In development, include OTP for testing (NEVER in production)
    const isDev = process.env.NODE_ENV === "development";

    return {
      mobile,
      expiresIn: 300, // 5 minutes in seconds
      messageId: smsResult.messageId,
      ...(isDev ? { devOtp: plainOtp } : {}),
    };
  },
});
