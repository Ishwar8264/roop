/**
 * Purpose: Email + Password registration
 * Endpoint: POST /api/auth/register-email
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/database/prisma";
import { hashPassword } from "@/lib/server/crypto";
import { logAuthEvent } from "@/features/auth/services/auth-event-service";
import { createSession, getUserWithProviders } from "@/features/auth/services/session-service";
import { setRefreshTokenCookie } from "@/lib/server/cookies";
import { registerEmailSchema } from "@/features/auth/validations/auth";
import { AuthEmailExistsError, AuthPhoneExistsError, isAppError, toAppError } from "@/lib/server/errors";
import { HTTP_STATUS, ERROR_CODES } from "@/shared/constants";
import { Prisma } from "@prisma/client";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = registerEmailSchema.safeParse(body);
    if (!result.success) {
      const firstIssue = result.error.issues[0];
      const fieldPath = firstIssue.path.join(".");
      const message = fieldPath ? `${fieldPath}: ${firstIssue.message}` : firstIssue.message;
      return NextResponse.json({ success: false, error: ERROR_CODES.VAL_INVALID_INPUT, message, statusCode: HTTP_STATUS.BAD_REQUEST }, { status: 400 });
    }

    const { name, email, password, phone } = result.data;

    // Create user + account in transaction (handles race conditions via Prisma unique constraint)
    const hashedPassword = await hashPassword(password);
    let user;
    try {
      user = await prisma.$transaction(async (tx) => {
        const newUser = await tx.user.create({
          data: { name, email, password: hashedPassword, phone: phone || null, emailVerified: false, role: "USER", isActive: true, loyaltyPoints: 0 },
        });
        await tx.account.create({ data: { userId: newUser.id, provider: "EMAIL", providerAccountId: email } });
        return newUser;
      });
    } catch (error) {
      // Handle Prisma unique constraint violation (P2002) — race condition
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        const field = (error.meta?.target as string[])?.[0];
        if (field === "email") throw new AuthEmailExistsError();
        if (field === "phone") throw new AuthPhoneExistsError();
      }
      throw error;
    }

    // Create session
    const { accessToken, refreshToken } = await createSession(user.id, "USER", request);

    // Get user with providers
    const fullUser = await getUserWithProviders(user.id);

    // Build response — accessToken in JSON, refreshToken in HttpOnly cookie ONLY
    const response = NextResponse.json({
      success: true,
      data: { user: fullUser, tokens: { accessToken } },
      message: "Registration successful! Welcome to Nikharta Roop.",
    }, { status: 201 });

    setRefreshTokenCookie(response, refreshToken);

    await logAuthEvent("REGISTER_EMAIL", request, { userId: user.id, identifier: email, metadata: { authProvider: "EMAIL" } });

    return response;
  } catch (error: unknown) {
    if (isAppError(error)) {
      return NextResponse.json({ success: false, error: error.code, message: error.message, statusCode: error.statusCode }, { status: error.statusCode });
    }
    console.error("[UNHANDLED_ERROR]", error);
    return NextResponse.json({ success: false, error: ERROR_CODES.SYS_INTERNAL, message: "An unexpected error occurred.", statusCode: 500 }, { status: 500 });
  }
}
