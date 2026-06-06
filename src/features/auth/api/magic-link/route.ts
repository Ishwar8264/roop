/**
 * Purpose: Send magic link to email
 * Responsibility: Create a fresh email magic link token and invalidate previous unused tokens
 * Important Notes:
 *   - Endpoint: POST /api/auth/magic-link
 *   - Email delivery is currently stubbed
 *   - Newly created token must stay unused after invalidating older tokens
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

    // 2. Hash token and find user by email (if exists)
    const [hashedToken, existingUser] = await Promise.all([
      hashOtp(plainToken),
      prisma.user.findUnique({ where: { email } }),
    ]);

    // 3. Store verification token
    const verificationToken = await prisma.verificationToken.create({
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
        id: { not: verificationToken.id },
      },
      data: { usedAt: new Date() }, // mark as used to invalidate
    });

    // 5. Send magic link email (stubbed)
    console.warn(`[STUB_EMAIL] Magic link email sent to ${email}`);

    // TODO: Send email via SendGrid/Resend/SES

    // 6. Log event
    await logAuthEvent("MAGIC_LINK_SENT", request, {
      identifier: email,
      userId: existingUser?.id,
    });

    return { email, expiresIn: MAGIC_LINK_CONFIG.EXPIRY_SECONDS };
  },
});
