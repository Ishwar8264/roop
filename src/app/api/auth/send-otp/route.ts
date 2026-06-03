/**
 * Purpose: Send OTP API endpoint for Nikharta Roop auth
 * Responsibility: Validate mobile/email, check registration status, rate limit, generate OTP, send via SMS/Email
 *
 * Endpoint: POST /api/auth/send-otp
 *
 * Request Body:
 *   mobile?: string (Indian 10-digit, starts with 6-9) — required for phone OTP
 *   email?: string (valid email) — required for email OTP
 *   purpose: "LOGIN" | "REGISTER" — required (default: LOGIN)
 *   At least one of mobile or email must be provided
 *
 * Responses:
 *   200: { success: true, data: { mobile?, email?, expiresIn, messageId }, message }
 *   400: { success: false, error: "VAL_INVALID_INPUT", message, statusCode: 400 }
 *   404: { success: false, error: "AUTH_MOBILE_NOT_REGISTERED"|"AUTH_EMAIL_NOT_REGISTERED", message, statusCode: 404 }
 *   409: { success: false, error: "AUTH_MOBILE_EXISTS"|"AUTH_EMAIL_EXISTS", message, statusCode: 409 }
 *   429: { success: false, error: "AUTH_OTP_ALREADY_SENT"|"AUTH_HOURLY_LIMIT", message, statusCode: 429, retryAfterSeconds }
 *   500: { success: false, error: "SYS_SMS_FAILED"|"SYS_EMAIL_FAILED", message, statusCode: 500 }
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
  AuthEmailNotRegisteredError,
  AuthMobileExistsError,
  AuthEmailExistsError,
} from "@/lib/errors";

export const POST = createApiHandler({
  schema: sendOtpSchema,
  successMessage: HTTP_MESSAGES.AUTH_OTP_SENT_SUCCESS.messageEn,
  handler: async ({ parsedBody, request }) => {
    const { mobile, email, purpose } = parsedBody;

    // Determine the identifier for rate limiting and OTP storage
    const identifier = mobile || email!;
    const isEmailOtp = !!email && !mobile;

    // 1. Check registration status based on purpose
    let existingUser = null;

    if (mobile) {
      existingUser = await prisma.user.findUnique({ where: { mobile } });
    } else if (email) {
      existingUser = await prisma.user.findUnique({ where: { email } });
    }

    if (purpose === "LOGIN") {
      // LOGIN: user MUST be registered
      if (!existingUser) {
        if (isEmailOtp) {
          throw new AuthEmailNotRegisteredError();
        }
        throw new AuthMobileNotRegisteredError();
      }
    } else if (purpose === "REGISTER") {
      // REGISTER: user must NOT be registered
      if (existingUser) {
        if (isEmailOtp) {
          throw new AuthEmailExistsError();
        }
        throw new AuthMobileExistsError();
      }
    }

    // 2. Check rate limiting — prevent OTP spam
    const rateLimitResult = checkRateLimit(identifier);
    if (!rateLimitResult.allowed) {
      if (rateLimitResult.reason === "OTP_ALREADY_SENT") {
        throw new AuthOtpAlreadySentError(rateLimitResult.retryAfterSeconds);
      }
      throw new AuthHourlyLimitError(rateLimitResult.retryAfterSeconds);
    }

    // 3. Invalidate any existing unused OTPs for this identifier
    await prisma.authOtp.updateMany({
      where: {
        mobile: identifier,
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
        mobile: identifier, // Use identifier (mobile or email) as the key
        otp: hashedOtp,
        purpose,
        attempts: 0,
        isUsed: false,
        expiresAt,
      },
    });

    // 6. Send OTP via SMS or Email
    if (isEmailOtp) {
      // Email OTP — currently stubbed (TODO: implement email sending)
      // For now, in development mode, the OTP is returned in the response
      // In production, you would call an email service here
      console.log(`[EMAIL OTP] OTP for ${email}: ${plainOtp}`);
    } else {
      // Phone OTP — send via SMS
      const smsResult = await sendOtpSms(mobile!, plainOtp, purpose);
      if (!smsResult.success) {
        throw new AuthSmsFailedError();
      }
    }

    // 7. Record rate limit entry AFTER successful send
    recordOtpSent(identifier);

    // 8. Log auth event for audit trail
    await logAuthEvent(identifier, "OTP_SENT", request, { purpose, method: isEmailOtp ? "EMAIL" : "SMS" });

    // 9. Return data
    // In development, include OTP for testing (NEVER in production)
    const isDev = process.env.NODE_ENV === "development";

    return {
      ...(mobile ? { mobile } : {}),
      ...(email ? { email } : {}),
      expiresIn: 300, // 5 minutes in seconds
      ...(isDev ? { devOtp: plainOtp } : {}),
    };
  },
});
