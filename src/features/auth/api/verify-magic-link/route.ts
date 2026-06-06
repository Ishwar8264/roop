/**
 * Purpose: Verify magic link token and redirect to callback
 * Endpoint: GET /api/auth/verify-magic-link?token=xxx
 *
 * Flow:
 * 1. Get token from query params
 * 2. Find verification token in DB (filtered by type for O(1) lookup)
 * 3. Verify token (not expired, not used)
 * 4. Mark token as used (idempotent — safe even if prefetched)
 * 5. Store pending verification in Redis (NO session creation — that's a POST concern)
 * 6. Redirect to frontend callback page with code
 *
 * Security: GET handler is now side-effect-free for session creation.
 * The actual session is created in POST /api/auth/exchange-code,
 * which cannot be triggered by CSRF or prefetching.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/database/prisma";
import { verifyOtpHash, generateMagicLinkToken, hashTokenSha256 } from "@/lib/server/crypto";
import { redis } from "@/lib/config/redis";
import { AuthMagicLinkInvalidError, AuthMagicLinkExpiredError } from "@/lib/server/errors";
import { APP_URL } from "@/shared/constants";

const PENDING_VERIFICATION_EXPIRY_SECONDS = 120; // 2 minutes to exchange

export async function GET(request: NextRequest) {
  try {
    const token = request.nextUrl.searchParams.get("token");
    if (!token) {
      throw new AuthMagicLinkInvalidError();
    }

    // 1. Find all unused magic link tokens (filtered by type + not expired)
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

    // 4. Mark token as used (idempotent — safe even if browser prefetches)
    await prisma.verificationToken.update({
      where: { id: matchedToken.id },
      data: { usedAt: new Date() },
    });

    const email = matchedToken.identifier;
    const userId = matchedToken.userId;

    // 5. Store pending verification in Redis (NOT session tokens)
    //    The exchange-code POST handler will create the actual session
    const authCode = generateMagicLinkToken();
    const codeHash = await hashTokenSha256(authCode);

    // Check if user exists and has email verified
    const existingUser = userId
      ? await prisma.user.findUnique({ where: { id: userId }, select: { id: true, emailVerified: true } })
      : null;

    await redis.setex(
      `auth_code:${codeHash}`,
      PENDING_VERIFICATION_EXPIRY_SECONDS,
      JSON.stringify({
        type: "magic_link_pending",
        email,
        userId: userId || null,
        isNewUser: !existingUser,
        emailVerified: existingUser?.emailVerified ?? false,
      })
    );

    // 6. Redirect to frontend with auth code (NOT access token)
    const redirectUrl = new URL("/auth/callback", APP_URL);
    redirectUrl.searchParams.set("code", authCode);

    return NextResponse.redirect(redirectUrl.toString());
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
