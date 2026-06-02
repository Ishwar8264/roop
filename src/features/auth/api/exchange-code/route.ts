/**
 * Purpose: Exchange one-time auth code for access token
 * Endpoint: POST /api/auth/exchange-code
 *
 * Flow:
 *   1. Validate code from request body
 *   2. Look up auth code in Redis (keyed by SHA-256 hash of the code)
 *   3. If found: return access token + set refresh token cookie
 *   4. Delete the auth code from Redis (one-time use)
 *
 * This replaces the old pattern of putting access tokens in the URL
 * during magic link redirects — much more secure.
 */

import { createApiHandler } from "@/lib/server/api-handler";
import { hashTokenSha256 } from "@/lib/server/crypto";
import { redis } from "@/lib/config/redis";
import { setRefreshTokenCookie } from "@/lib/server/cookies";
import { AuthMagicLinkInvalidError } from "@/lib/server/errors";
import { z } from "zod";
import { NextResponse } from "next/server";

const exchangeCodeSchema = z.object({
  code: z.string().min(1, "Auth code is required"),
});

export type ExchangeCodeInput = z.infer<typeof exchangeCodeSchema>;

export const POST = createApiHandler<ExchangeCodeInput, { accessToken: string; isNewUser: boolean }>({
  schema: exchangeCodeSchema,
  handler: async ({ parsedBody }) => {
    const { code } = parsedBody;

    // 1. Hash the code to look up in Redis
    const codeHash = await hashTokenSha256(code);
    const redisKey = `auth_code:${codeHash}`;

    // 2. Get stored token data
    const raw = await redis.get(redisKey);
    if (!raw) {
      throw new AuthMagicLinkInvalidError();
    }

    // 3. Delete the code (one-time use)
    await redis.del(redisKey);

    // 4. Parse token data
    const tokenData = JSON.parse(raw) as {
      accessToken: string;
      refreshToken: string;
      isNewUser: boolean;
    };

    return {
      accessToken: tokenData.accessToken,
      isNewUser: tokenData.isNewUser,
      _refreshToken: tokenData.refreshToken, // Internal — used by responseBuilder
    };
  },
  responseBuilder: (data) => {
    const { _refreshToken, ...publicData } = data as Record<string, unknown>;
    const response = NextResponse.json({
      success: true,
      data: publicData,
      message: "Authentication successful.",
    }, { status: 200 });

    if (_refreshToken && typeof _refreshToken === "string") {
      setRefreshTokenCookie(response, _refreshToken);
    }

    return response;
  },
});
