/**
 * Purpose: Google OAuth login
 * Endpoint: POST /api/auth/google
 */

import { NextRequest, NextResponse } from "next/server";
import { OAuth2Client } from "google-auth-library";
import { prisma } from "@/lib/database/prisma";
import { logAuthEvent } from "@/features/auth/services/auth-event-service";
import { createSession, getUserWithProviders } from "@/features/auth/services/session-service";
import { setAccessTokenCookie, setRefreshTokenCookie } from "@/lib/server/cookies";
import { googleAuthSchema } from "@/features/auth/validations/auth";
import { AuthGoogleTokenInvalidError, AuthAccountSuspendedError, isAppError } from "@/lib/server/errors";
import { ERROR_CODES } from "@/shared/constants";

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "";
const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = googleAuthSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ success: false, error: ERROR_CODES.VAL_INVALID_INPUT, message: result.error.issues[0].message, statusCode: 400 }, { status: 400 });
    }

    const { idToken } = result.data;

    // Verify Google token
    let googleUser: { googleId: string; email: string; emailVerified: boolean; name: string; picture: string };
    try {
      const ticket = await googleClient.verifyIdToken({ idToken, audience: GOOGLE_CLIENT_ID });
      const payload = ticket.getPayload();
      if (!payload?.sub || !payload?.email) throw new AuthGoogleTokenInvalidError();
      googleUser = { googleId: payload.sub, email: payload.email, emailVerified: payload.email_verified || false, name: payload.name || payload.email.split("@")[0], picture: payload.picture || "" };
    } catch (error) {
      if (error instanceof AuthGoogleTokenInvalidError) throw error;
      throw new AuthGoogleTokenInvalidError();
    }

    // Find or create user with account linking
    let user;
    let isNewUser = false;

    const existingAccount = await prisma.account.findUnique({
      where: { provider_providerAccountId: { provider: "GOOGLE", providerAccountId: googleUser.googleId } },
      include: { user: true },
    });

    if (existingAccount) {
      user = existingAccount.user;
    } else {
      const existingUser = await prisma.user.findUnique({ where: { email: googleUser.email } });
      if (existingUser) {
        await prisma.account.create({ data: { userId: existingUser.id, provider: "GOOGLE", providerAccountId: googleUser.googleId } });
        const updates: Record<string, unknown> = {};
        if (!existingUser.name) updates.name = googleUser.name;
        if (!existingUser.avatarUrl) updates.avatarUrl = googleUser.picture;
        if (!existingUser.emailVerified && googleUser.emailVerified) updates.emailVerified = true;
        if (Object.keys(updates).length > 0) await prisma.user.update({ where: { id: existingUser.id }, data: updates });
        user = existingUser;
        await logAuthEvent("ACCOUNT_LINKED", request, { userId: existingUser.id, identifier: googleUser.email, metadata: { linkedProvider: "GOOGLE" } });
      } else {
        user = await prisma.$transaction(async (tx) => {
          const newUser = await tx.user.create({ data: { email: googleUser.email, emailVerified: googleUser.emailVerified, name: googleUser.name, avatarUrl: googleUser.picture || null, role: "USER", isActive: true, loyaltyPoints: 0 } });
          await tx.account.create({ data: { userId: newUser.id, provider: "GOOGLE", providerAccountId: googleUser.googleId } });
          return newUser;
        });
        isNewUser = true;
      }
    }

    if (!user.isActive) throw new AuthAccountSuspendedError();

    const { accessToken, refreshToken } = await createSession(user.id, user.role as "USER" | "STAFF" | "ADMIN", request);

    const fullUser = await getUserWithProviders(user.id);

    // Build response — tokens are HttpOnly cookies only
    const response = NextResponse.json({
      success: true,
      data: { user: fullUser, isNewUser },
      ...(isNewUser && { message: "Registration successful! Welcome to Nikharta Roop." }),
    }, { status: isNewUser ? 201 : 200 });

    setRefreshTokenCookie(response, refreshToken);
    setAccessTokenCookie(response, accessToken);

    await logAuthEvent(isNewUser ? "REGISTER_GOOGLE" : "LOGIN_SUCCESS", request, { userId: user.id, identifier: googleUser.email, metadata: { authProvider: "GOOGLE", isNewUser } });

    return response;
  } catch (error: unknown) {
    if (isAppError(error)) {
      return NextResponse.json({ success: false, error: error.code, message: error.message, statusCode: error.statusCode }, { status: error.statusCode });
    }
    console.error("[UNHANDLED_ERROR]", error);
    return NextResponse.json({ success: false, error: ERROR_CODES.SYS_INTERNAL, message: "An unexpected error occurred.", statusCode: 500 }, { status: 500 });
  }
}
