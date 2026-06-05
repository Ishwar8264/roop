/**
 * Purpose: Exchange one-time auth code for access token
 * Endpoint: POST /api/auth/exchange-code
 *
 * Flow:
 *   1. Validate code from request body
 *   2. Look up auth code in Redis (keyed by SHA-256 hash of the code)
 *   3. If pending magic link verification:
 *      a. Find or create user
 *      b. Create session (side effect now safely in POST — not GET)
 *      c. Log event
 *   4. If already has tokens (legacy): return them directly
 *   5. Delete the auth code from Redis (one-time use)
 *
 * Security: Session creation moved here from GET handler to prevent
 * CSRF attacks. POST requests cannot be triggered by prefetching.
 */

import { createApiHandler } from "@/lib/server/api-handler";
import { hashTokenSha256 } from "@/lib/server/crypto";
import { redis } from "@/lib/config/redis";
import { setRefreshTokenCookie, setAccessTokenCookie } from "@/lib/server/cookies";
import { AuthMagicLinkInvalidError } from "@/lib/server/errors";
import { createSession } from "@/features/auth/services/session-service";
import { logAuthEvent } from "@/features/auth/services/auth-event-service";
import { prisma } from "@/lib/database/prisma";
import { z } from "zod";
import { NextRequest, NextResponse } from "next/server";

const exchangeCodeSchema = z.object({
  code: z.string().min(1, "Auth code is required"),
});

export type ExchangeCodeInput = z.infer<typeof exchangeCodeSchema>;

export const POST = createApiHandler<ExchangeCodeInput, { accessToken: string; isNewUser: boolean }>({
  schema: exchangeCodeSchema,
  handler: async ({ parsedBody, request }) => {
    const { code } = parsedBody;

    // 1. Hash the code to look up in Redis
    const codeHash = await hashTokenSha256(code);
    const redisKey = `auth_code:${codeHash}`;

    // 2. Get stored data
    const raw = await redis.get(redisKey);
    if (!raw) {
      throw new AuthMagicLinkInvalidError();
    }

    // 3. Delete the code (one-time use)
    await redis.del(redisKey);

    // 4. Parse stored data
    const storedData = JSON.parse(raw) as {
      type?: string;
      accessToken?: string;
      refreshToken?: string;
      isNewUser?: boolean;
      // New magic link pending fields
      email?: string;
      userId?: string | null;
      emailVerified?: boolean;
    };

    // 5. Handle legacy format (already has tokens)
    if (storedData.accessToken && storedData.refreshToken) {
      return {
        accessToken: storedData.accessToken,
        isNewUser: storedData.isNewUser ?? false,
        _refreshToken: storedData.refreshToken,
      };
    }

    // 6. Handle new magic link pending verification
    if (storedData.type === "magic_link_pending" && storedData.email) {
      const { email, isNewUser: storedIsNewUser } = storedData;

      // Find or create user
      let user = await prisma.user.findUnique({ where: { email } });
      let isNewUser = storedIsNewUser ?? false;

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

      // Create session (side effect now safely in POST — not vulnerable to CSRF)
      const { accessToken, refreshToken } = await createSession(
        user.id,
        user.role as "USER" | "STAFF" | "ADMIN",
        request as NextRequest
      );

      // Log event
      await logAuthEvent("MAGIC_LINK_VERIFIED", request as NextRequest, {
        userId: user.id,
        identifier: email,
        metadata: { isNewUser },
      });

      return {
        accessToken,
        isNewUser,
        _refreshToken: refreshToken,
      };
    }

    // Unknown format — invalid
    throw new AuthMagicLinkInvalidError();
  },
  responseBuilder: (data) => {
    const { _refreshToken, accessToken, ...publicData } = data as Record<string, unknown>;
    const response = NextResponse.json({
      success: true,
      data: publicData,
      message: "Authentication successful.",
    }, { status: 200 });

    if (_refreshToken && typeof _refreshToken === "string") {
      setRefreshTokenCookie(response, _refreshToken);
    }

    // Also set access token as short-lived cookie for page route auth
    if (accessToken && typeof accessToken === "string") {
      setAccessTokenCookie(response, accessToken);
    }

    return response;
  },
});
