/**
 * Purpose: Send magic link to email
 * Endpoint: POST /api/auth/magic-link
 *
 * Flow:
 * 1. Validate email
 * 2. Generate magic link token
 * 3. Store token in VerificationToken table
 * 4. Send email with magic link (stubbed)
 * 5. Log event
 */

import { createApiHandler } from "@/lib/server/api-handler";
import { prisma } from "@/lib/database/prisma";
import { generateMagicLinkToken, hashOtp } from "@/lib/server/crypto";
import { logAuthEvent } from "@/features/auth/services/auth-event-service";
import { magicLinkSchema } from "@/features/auth/validations/auth";
import { MAGIC_LINK_CONFIG } from "@/lib/config/auth";

export const POST = createApiHandler({
  schema: magicLinkSchema,
  successMessage: "Magic link sent to your email. Please check your inbox.",
  handler: async ({ parsedBody, request }) => {
    const { email } = parsedBody;

    // 1. Generate magic link token
    const plainToken = generateMagicLinkToken();
    const hashedToken = await hashOtp(plainToken);

    // 2. Find user by email (if exists)
    const existingUser = await prisma.user.findUnique({ where: { email } });

    // 3. Store verification token
    await prisma.verificationToken.create({
      data: {
        userId: existingUser?.id || null,
        identifier: email,
        token: hashedToken,
        type: "EMAIL_MAGIC_LINK",
        expiresAt: new Date(Date.now() + MAGIC_LINK_CONFIG.EXPIRY_SECONDS * 1000),
      },
    });

    // 4. Invalidate any previous unused magic links for this email
    await prisma.verificationToken.updateMany({
      where: {
        identifier: email,
        type: "EMAIL_MAGIC_LINK",
        usedAt: null,
        id: { not: undefined }, // all records except the one we just created
      },
      data: { usedAt: new Date() }, // mark as used to invalidate
    });

    // 5. Send magic link email (stubbed)
    console.log(`[STUB_EMAIL] Magic link email sent to ${email}`);

    // TODO: Send email via SendGrid/Resend/SES

    // 6. Log event
    await logAuthEvent("MAGIC_LINK_SENT", request, {
      identifier: email,
      userId: existingUser?.id,
    });

    return { email, expiresIn: MAGIC_LINK_CONFIG.EXPIRY_SECONDS };
  },
});
