/**
 * Purpose: Email + Password Registration API endpoint
 * Responsibility: Validate email/password, check duplicates, hash password, create user, issue tokens
 *
 * Endpoint: POST /api/auth/register-email
 *
 * Request Body:
 *   name: string (required, 1-100 chars)
 *   email: string (required, valid email)
 *   password: string (required, min 8 chars, 1 uppercase, 1 lowercase, 1 digit)
 *   mobile: string (optional, Indian 10-digit)
 *
 * Responses:
 *   201: { success: true, data: { user, tokens }, message }
 *   400: { success: false, error: "VAL_INVALID_INPUT", message, statusCode: 400 }
 *   409: { success: false, error: "AUTH_EMAIL_EXISTS"|"AUTH_MOBILE_EXISTS", message, statusCode: 409 }
 */

import bcrypt from "bcryptjs";
import { createApiHandler } from "@/lib/api-handler";
import { prisma } from "@/lib/prisma";
import { registerEmailSchema } from "@/lib/validations/auth";
import { createAuthSessionAndTokens } from "@/lib/create-auth-session";
import { logAuthEvent } from "@/lib/auth-helpers";
import { AuthEmailExistsError, AuthMobileExistsError } from "@/lib/errors";
import { HTTP_STATUS } from "@/lib/http";

const PASSWORD_SALT_ROUNDS = 12;

export const POST = createApiHandler({
  schema: registerEmailSchema,
  successMessage: "Registration successful! Welcome to Nikharta Roop.",
  successStatus: HTTP_STATUS.CREATED,
  handler: async ({ parsedBody, request }) => {
    const { name, email, password, mobile } = parsedBody;

    // 1. Check if email already exists
    const existingEmailUser = await prisma.user.findUnique({
      where: { email },
    });
    if (existingEmailUser) {
      throw new AuthEmailExistsError();
    }

    // 2. Check if mobile already exists (if provided)
    if (mobile) {
      const existingMobileUser = await prisma.user.findUnique({
        where: { mobile },
      });
      if (existingMobileUser) {
        throw new AuthMobileExistsError();
      }
    }

    // 3. Hash password
    const hashedPassword = await bcrypt.hash(password, PASSWORD_SALT_ROUNDS);

    // 4. Create user with EMAIL auth provider
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        mobile: mobile || null,
        emailVerified: false, // TODO: Send verification email
        authProvider: "EMAIL",
        role: "USER",
        isActive: true,
        loyaltyPoints: 0,
      },
    });

    // 5. Create auth session + generate tokens
    const authResult = await createAuthSessionAndTokens(user, request);

    // 6. Log registration event
    await logAuthEvent(
      mobile || null,
      "REGISTER_EMAIL",
      request,
      { email, authProvider: "EMAIL" },
      user.id
    );

    return authResult;
  },
});
