/**
 * Purpose: Send OTP API endpoint for Nikharta Roop auth
 * Responsibility: Validate mobile, rate limit, generate OTP, hash and store, send via SMS
 * Important Notes:
 *   - POST /api/auth/send-otp
 *   - Body: { mobile: "9876543210" }
 *   - Rate limited: 1 OTP/min, 5 OTPs/hour per mobile
 *   - OTP stored as bcrypt hash in AuthOtp table — plain OTP never stored
 *   - SMS sending is stubbed — replace with real gateway in production
 *   - Logs AuthEvent for audit trail
 */

import { NextRequest } from "next/server";
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
import {
  apiSuccess,
  apiBadRequest,
  apiRateLimited,
  apiServerError,
} from "@/lib/api-response";

export async function POST(request: NextRequest) {
  try {
    // 1. Parse and validate request body
    const body = await request.json();
    const parsed = sendOtpSchema.safeParse(body);

    if (!parsed.success) {
      const firstError = parsed.error.issues[0];
      return apiBadRequest(firstError.message);
    }

    const { mobile } = parsed.data;

    // 2. Check rate limiting — prevent OTP spam
    const rateLimitResult = checkRateLimit(mobile);
    if (!rateLimitResult.allowed) {
      return apiRateLimited(
        rateLimitResult.reason === "OTP_ALREADY_SENT"
          ? "OTP already sent. Please wait before requesting again."
          : "Too many OTP requests. Please try again later.",
        rateLimitResult.retryAfterSeconds
      );
    }

    // 3. Invalidate any existing unused OTPs for this mobile
    await prisma.authOtp.updateMany({
      where: {
        mobile,
        isUsed: false,
        expiresAt: { gt: new Date() },
      },
      data: { isUsed: true }, // Mark old OTPs as used so they can't be verified
    });

    // 4. Generate new OTP
    const plainOtp = generateOtp();
    const hashedOtp = await hashOtp(plainOtp);
    const expiresAt = getOtpExpiry();

    // 5. Store hashed OTP in database
    await prisma.authOtp.create({
      data: {
        mobile,
        otp: hashedOtp,
        purpose: "LOGIN", // Default purpose — can be extended
        attempts: 0,
        isUsed: false,
        expiresAt,
      },
    });

    // 6. Send OTP via SMS (currently stubbed)
    const smsResult = await sendOtpSms(mobile, plainOtp, "LOGIN");

    if (!smsResult.success) {
      // SMS failed — still log but don't expose OTP details
      return apiServerError("Failed to send OTP. Please try again.");
    }

    // 7. Record rate limit entry AFTER successful send
    recordOtpSent(mobile);

    // 8. Log auth event for audit trail
    await prisma.authEvent.create({
      data: {
        mobile,
        event: "OTP_SENT",
        ip: request.headers.get("x-forwarded-for") || null,
        device: request.headers.get("user-agent") || null,
        metadata: { purpose: "LOGIN" },
      },
    });

    // 9. Return success — NEVER include OTP in response
    return apiSuccess(
      {
        mobile,
        expiresIn: 300, // 5 minutes in seconds
        messageId: smsResult.messageId,
      },
      "OTP sent successfully"
    );
  } catch (error) {
    console.error("[SEND_OTP_ERROR]", error);
    return apiServerError("Failed to send OTP. Please try again.");
  }
}
