/**
 * Purpose: Verify OTP API endpoint for Nikharta Roop auth
 * Responsibility: Validate OTP, login existing user or register new user, issue JWT tokens
 * Important Notes:
 *   - POST /api/auth/verify-otp
 *   - Body: { mobile: "9876543210", otp: "123456" }
 *   - Max 3 verification attempts per OTP
 *   - Auto-registers new users (isNewUser flag in response)
 *   - Creates AuthSession record for logout/invalidation
 *   - Returns access token (15 min) + refresh token (7 days)
 *   - Logs AuthEvent for audit trail (LOGIN_SUCCESS or LOGIN_FAILED)
 */

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyOtp, isOtpExpired, getMaxAttempts } from "@/lib/otp";
import { generateTokenPair } from "@/lib/jwt";
import { verifyOtpSchema } from "@/lib/validations/auth";
import {
  apiSuccess,
  apiBadRequest,
  apiUnauthorized,
  apiServerError,
} from "@/lib/api-response";

export async function POST(request: NextRequest) {
  try {
    // 1. Parse and validate request body
    const body = await request.json();
    const parsed = verifyOtpSchema.safeParse(body);

    if (!parsed.success) {
      const firstError = parsed.error.issues[0];
      return apiBadRequest(firstError.message);
    }

    const { mobile, otp } = parsed.data;

    // 2. Find the latest valid (unused, not expired) OTP for this mobile
    const otpRecord = await prisma.authOtp.findFirst({
      where: {
        mobile,
        isUsed: false,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: "desc" },
    });

    if (!otpRecord) {
      // No valid OTP found — either expired or never sent
      await prisma.authEvent.create({
        data: {
          mobile,
          event: "LOGIN_FAILED",
          ip: request.headers.get("x-forwarded-for") || null,
          device: request.headers.get("user-agent") || null,
          metadata: { reason: "NO_VALID_OTP" },
        },
      });

      return apiUnauthorized(
        "No valid OTP found. Please request a new OTP."
      );
    }

    // 3. Check if max attempts exceeded
    if (otpRecord.attempts >= getMaxAttempts()) {
      await prisma.authOtp.update({
        where: { id: otpRecord.id },
        data: { isUsed: true }, // Invalidate OTP after max attempts
      });

      await prisma.authEvent.create({
        data: {
          mobile,
          event: "LOGIN_FAILED",
          ip: request.headers.get("x-forwarded-for") || null,
          device: request.headers.get("user-agent") || null,
          metadata: { reason: "MAX_ATTEMPTS_EXCEEDED" },
        },
      });

      return apiUnauthorized(
        "Maximum verification attempts exceeded. Please request a new OTP."
      );
    }

    // 4. Increment attempt counter
    await prisma.authOtp.update({
      where: { id: otpRecord.id },
      data: { attempts: { increment: 1 } },
    });

    // 5. Verify OTP (bcrypt compare — plain vs hashed)
    const isValidOtp = await verifyOtp(otp, otpRecord.otp);

    if (!isValidOtp) {
      await prisma.authEvent.create({
        data: {
          mobile,
          event: "LOGIN_FAILED",
          ip: request.headers.get("x-forwarded-for") || null,
          device: request.headers.get("user-agent") || null,
          metadata: {
            reason: "INVALID_OTP",
            attemptsRemaining: getMaxAttempts() - otpRecord.attempts - 1,
          },
        },
      });

      const attemptsRemaining = getMaxAttempts() - otpRecord.attempts - 1;
      return apiUnauthorized(
        attemptsRemaining > 0
          ? `Invalid OTP. ${attemptsRemaining} attempt${attemptsRemaining === 1 ? "" : "s"} remaining.`
          : "Invalid OTP. Maximum attempts exceeded. Please request a new OTP."
      );
    }

    // 6. Mark OTP as used
    await prisma.authOtp.update({
      where: { id: otpRecord.id },
      data: { isUsed: true },
    });

    // 7. Find or create user (auto-registration)
    let user = await prisma.user.findUnique({
      where: { mobile },
    });

    let isNewUser = false;

    if (!user) {
      // Auto-register new user with USER role
      user = await prisma.user.create({
        data: {
          mobile,
          role: "USER",
          isActive: true,
          loyaltyPoints: 0,
        },
      });
      isNewUser = true;
    }

    // 8. Check if user account is active
    if (!user.isActive) {
      await prisma.authEvent.create({
        data: {
          userId: user.id,
          mobile,
          event: "LOGIN_FAILED",
          ip: request.headers.get("x-forwarded-for") || null,
          device: request.headers.get("user-agent") || null,
          metadata: { reason: "ACCOUNT_SUSPENDED" },
        },
      });

      return apiUnauthorized(
        "Your account has been suspended. Please contact support."
      );
    }

    // 9. Create auth session
    const { accessToken, refreshToken } = await generateTokenPair({
      userId: user.id,
      mobile: user.mobile,
      role: user.role,
      sessionId: "", // Will set after creating session record
    });

    // We need sessionId in the token, so we create session first with a placeholder,
    // then regenerate tokens with the actual sessionId
    const session = await prisma.authSession.create({
      data: {
        userId: user.id,
        token: await hashToken(accessToken), // Store hash of access token
        device: request.headers.get("user-agent") || null,
        ip: request.headers.get("x-forwarded-for") || null,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    });

    // 10. Regenerate tokens with proper sessionId
    const finalTokens = await generateTokenPair({
      userId: user.id,
      mobile: user.mobile,
      role: user.role,
      sessionId: session.id,
    });

    // Update session with proper token hash
    await prisma.authSession.update({
      where: { id: session.id },
      data: { token: await hashToken(finalTokens.accessToken) },
    });

    // 11. Update user's lastLoginAt
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // 12. Log successful login
    await prisma.authEvent.create({
      data: {
        userId: user.id,
        mobile,
        event: "LOGIN_SUCCESS",
        ip: request.headers.get("x-forwarded-for") || null,
        device: request.headers.get("user-agent") || null,
        metadata: { isNewUser, sessionId: session.id },
      },
    });

    // 13. Return tokens and user data
    return apiSuccess(
      {
        user: {
          id: user.id,
          mobile: user.mobile,
          name: user.name,
          email: user.email,
          role: user.role,
          avatarUrl: user.avatarUrl,
          loyaltyPoints: user.loyaltyPoints,
        },
        tokens: {
          accessToken: finalTokens.accessToken,
          refreshToken: finalTokens.refreshToken,
        },
        isNewUser,
      },
      isNewUser ? "Registration successful! Welcome to Nikharta Roop." : "Login successful!"
    );
  } catch (error) {
    console.error("[VERIFY_OTP_ERROR]", error);
    return apiServerError("Authentication failed. Please try again.");
  }
}

/**
 * Hash a token for storage in AuthSession
 * Uses SHA-256 for fast hashing (not bcrypt — tokens need fast comparison)
 */
async function hashToken(token: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(token);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}
