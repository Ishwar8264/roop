/**
 * Purpose: Verify magic link token and login/register
 * Endpoint: GET /api/auth/verify-magic-link?token=xxx
 *
 * Flow:
 * 1. Get token from query params
 * 2. Find verification token in DB (filtered by identifier for O(1) lookup)
 * 3. Verify token (not expired, not used)
 * 4. Find or create user
 * 5. Create EMAIL account link
 * 6. Mark token as used
 * 7. Create session
 * 8. Store one-time auth code in Redis for frontend exchange
 * 9. Redirect to frontend with code (NOT access token)
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/database/prisma";
import { verifyOtpHash, generateMagicLinkToken, hashTokenSha256 } from "@/lib/server/crypto";
import { logAuthEvent } from "@/features/auth/services/auth-event-service";
import { createSession, getUserWithProviders } from "@/features/auth/services/session-service";
import { setRefreshTokenCookie } from "@/lib/server/cookies";
import { redis } from "@/lib/config/redis";
import { AuthMagicLinkInvalidError, AuthMagicLinkExpiredError } from "@/lib/server/errors";
import { APP_URL } from "@/shared/constants";

const AUTH_CODE_EXPIRY_SECONDS = 60; // 1 minute to exchange code

export async function GET(request: NextRequest) {
  try {
    const token = request.nextUrl.searchParams.get("token");
    if (!token) {
      throw new AuthMagicLinkInvalidError();
    }

    // 1. Find all unused magic link tokens (filtered by type + not expired)
    //    We can't filter by identifier because we don't know the email from the raw token.
    //    However, we limit to recent tokens to avoid scanning too many.
    const verificationTokens = await prisma.verificationToken.findMany({
      where: {
        type: "EMAIL_MAGIC_LINK",
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: "desc" },
      take: 50, // Limit scan to recent 50 tokens max
    });

    // 2. Find matching token (bcrypt compare)
    let matchedToken: (typeof verificationTokens)[number] | null = null;
    for (const vt of verificationTokens) {
      const isValid = await verifyOtpHash(token, vt.token);
      if (isValid) {
        matchedToken = vt;
        break;
      }
    }

    if (!matchedToken) {
      throw new AuthMagicLinkInvalidError();
    }

    // 3. Check expiry (redundant but safe)
    if (new Date() > matchedToken.expiresAt) {
      throw new AuthMagicLinkExpiredError();
    }

    // 4. Mark token as used
    await prisma.verificationToken.update({
      where: { id: matchedToken.id },
      data: { usedAt: new Date() },
    });

    const email = matchedToken.identifier;

    // 5. Find or create user
    let user = await prisma.user.findUnique({ where: { email } });
    let isNewUser = false;

    if (!user) {
      user = await prisma.$transaction(async (tx) => {
        const newUser = await tx.user.create({
          data: { email, emailVerified: true, role: "USER", isActive: true, loyaltyPoints: 0 },
        });
        await tx.account.create({
          data: { userId: newUser.id, provider: "EMAIL", providerAccountId: email },
        });
        return newUser;
      });
      isNewUser = true;
    } else if (!user.emailVerified) {
      await prisma.user.update({ where: { id: user.id }, data: { emailVerified: true } });
    }

    if (!user) {
      throw new AuthMagicLinkInvalidError();
    }

    // 6. Create session
    const { accessToken, refreshToken } = await createSession(
      user.id,
      user.role as "USER" | "STAFF" | "ADMIN",
      request
    );

    // 7. Get user with providers
    const userWithProviders = await getUserWithProviders(user.id);

    // 8. Log event
    await logAuthEvent("MAGIC_LINK_VERIFIED", request, {
      userId: user.id,
      identifier: email,
      metadata: { isNewUser },
    });

    // 9. Generate one-time auth code for frontend exchange
    //    This avoids putting the access token in the URL
    const authCode = generateMagicLinkToken();
    const codeHash = await hashTokenSha256(authCode);
    await redis.setex(
      `auth_code:${codeHash}`,
      AUTH_CODE_EXPIRY_SECONDS,
      JSON.stringify({ accessToken, refreshToken, isNewUser })
    );

    // 10. Redirect to frontend with auth code (NOT access token)
    const redirectUrl = new URL("/auth/callback", APP_URL);
    redirectUrl.searchParams.set("code", authCode);
    redirectUrl.searchParams.set("isNewUser", String(isNewUser));

    const response = NextResponse.redirect(redirectUrl.toString());
    setRefreshTokenCookie(response, refreshToken);
    return response;
  } catch (error) {
    // Redirect to login page with error
    const redirectUrl = new URL("/login", APP_URL);
    if (error instanceof AuthMagicLinkExpiredError) {
      redirectUrl.searchParams.set("error", "magic_link_expired");
    } else {
      redirectUrl.searchParams.set("error", "magic_link_invalid");
    }
    return NextResponse.redirect(redirectUrl.toString());
  }
}
