/**
 * Purpose: Google OAuth Login API endpoint
 * Responsibility: Verify Google ID token, find or create user, create session, issue tokens
 *
 * Endpoint: POST /api/auth/google
 *
 * Request Body:
 *   idToken: string (required — Google ID token from frontend Google Sign-In)
 *
 * Flow:
 *   1. Frontend uses Google Sign-In SDK → gets idToken
 *   2. Frontend sends idToken to this endpoint
 *   3. Backend verifies idToken with Google
 *   4. Extracts email, name, googleId (sub) from token
 *   5. Finds existing user by googleId or email, or creates new user
 *   6. Returns JWT tokens
 *
 * Responses:
 *   200: { success: true, data: { user, tokens, isNewUser }, message }
 *   400: { success: false, error: "VAL_INVALID_INPUT", message, statusCode: 400 }
 *   401: { success: false, error: "AUTH_GOOGLE_TOKEN_INVALID", message, statusCode: 401 }
 */

import { OAuth2Client } from "google-auth-library";
import { createApiHandler } from "@/lib/api-handler";
import { prisma } from "@/lib/prisma";
import { googleAuthSchema } from "@/lib/validations/auth";
import { createAuthSessionAndTokens } from "@/lib/create-auth-session";
import { logAuthEvent } from "@/lib/auth-helpers";
import { setRefreshTokenCookie } from "@/lib/server/cookies";
import {
  AuthGoogleTokenInvalidError,
  AuthAccountSuspendedError,
} from "@/lib/errors";
import { NextResponse } from "next/server";

// ==================== GOOGLE CLIENT ====================

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "";
const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

// ==================== VERIFIED TOKEN TYPE ====================

interface GoogleUserInfo {
  googleId: string; // 'sub' claim
  email: string;
  emailVerified: boolean;
  name: string;
  picture: string;
}

// ==================== ROUTE HANDLER ====================

export const POST = createApiHandler({
  schema: googleAuthSchema,
  successMessage: "Google login successful!",
  handler: async ({ parsedBody, request }) => {
    const { idToken } = parsedBody;

    // 1. Verify Google ID token
    let googleUser: GoogleUserInfo;
    try {
      const ticket = await googleClient.verifyIdToken({
        idToken,
        audience: GOOGLE_CLIENT_ID,
      });
      const payload = ticket.getPayload();
      if (!payload || !payload.sub || !payload.email) {
        throw new AuthGoogleTokenInvalidError();
      }
      googleUser = {
        googleId: payload.sub,
        email: payload.email,
        emailVerified: payload.email_verified || false,
        name: payload.name || payload.email.split("@")[0],
        picture: payload.picture || "",
      };
    } catch (error) {
      if (error instanceof AuthGoogleTokenInvalidError) throw error;
      throw new AuthGoogleTokenInvalidError();
    }

    // 2. Find existing user by googleId first
    let user = await prisma.user.findUnique({
      where: { googleId: googleUser.googleId },
    });

    let isNewUser = false;

    if (!user) {
      // 3. Check if user exists with same email (account linking)
      user = await prisma.user.findUnique({
        where: { email: googleUser.email },
      });

      if (user) {
        // Link Google account to existing user
        user = await prisma.user.update({
          where: { id: user.id },
          data: {
            googleId: googleUser.googleId,
            emailVerified: googleUser.emailVerified,
            // If user didn't have a name, use Google name
            name: user.name || googleUser.name,
            // If user didn't have an avatar, use Google picture
            avatarUrl: user.avatarUrl || (googleUser.picture || null),
          },
        });
      } else {
        // 4. Create new user with Google info
        user = await prisma.user.create({
          data: {
            googleId: googleUser.googleId,
            email: googleUser.email,
            emailVerified: googleUser.emailVerified,
            name: googleUser.name,
            avatarUrl: googleUser.picture || null,
            authProvider: "GOOGLE",
            mobile: null, // User can add mobile later
            role: "USER",
            isActive: true,
            loyaltyPoints: 0,
          },
        });
        isNewUser = true;
      }
    }

    // 5. Check if account is active
    if (!user.isActive) {
      await logAuthEvent(user.mobile, "LOGIN_FAILED", request, {
        reason: "ACCOUNT_SUSPENDED",
        authProvider: "GOOGLE",
      }, user.id);
      throw new AuthAccountSuspendedError();
    }

    // 6. Create auth session + generate tokens
    const authResult = await createAuthSessionAndTokens(user, request);

    // 7. Log event
    await logAuthEvent(
      user.mobile,
      isNewUser ? "REGISTER_GOOGLE" : "LOGIN_GOOGLE",
      request,
      {
        email: googleUser.email,
        googleId: googleUser.googleId,
        authProvider: "GOOGLE",
        isNewUser,
      },
      user.id
    );

    return {
      ...authResult,
      isNewUser,
    };
  },
  // Custom response builder to set refresh token as HttpOnly cookie
  responseBuilder: (data) => {
    const { tokens, ...publicData } = data as Record<string, unknown>;
    const tokenData = tokens as { accessToken: string; refreshToken: string } | undefined;

    const response = NextResponse.json(
      {
        success: true,
        data: {
          ...publicData,
          tokens: tokenData ? { accessToken: tokenData.accessToken } : undefined,
        },
        message: "Google login successful!",
      },
      { status: 200 }
    );

    if (tokenData?.refreshToken) {
      setRefreshTokenCookie(response, tokenData.refreshToken);
    }

    return response;
  },
});
