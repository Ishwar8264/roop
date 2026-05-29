/**
 * Purpose: Email + Password Login API endpoint
 * Responsibility: Validate credentials, verify password, create session, issue tokens
 *
 * Endpoint: POST /api/auth/login-email
 *
 * Request Body:
 *   email: string (required, valid email)
 *   password: string (required)
 *
 * Responses:
 *   200: { success: true, data: { user, tokens }, message }
 *   400: { success: false, error: "VAL_INVALID_INPUT", message, statusCode: 400 }
 *   401: { success: false, error: "AUTH_INVALID_CREDENTIALS"|"AUTH_ACCOUNT_SUSPENDED", message, statusCode: 401 }
 */

import bcrypt from "bcryptjs";
import { createApiHandler } from "@/lib/api-handler";
import { prisma } from "@/lib/prisma";
import { loginEmailSchema } from "@/lib/validations/auth";
import { createAuthSessionAndTokens } from "@/lib/create-auth-session";
import { logAuthEvent } from "@/lib/auth-helpers";
import {
  AuthInvalidCredentialsError,
  AuthAccountSuspendedError,
} from "@/lib/errors";

export const POST = createApiHandler({
  schema: loginEmailSchema,
  successMessage: "Login successful!",
  handler: async ({ parsedBody, request }) => {
    const { email, password } = parsedBody;

    // 1. Find user by email (include password for comparison)
    const user = await prisma.user.findUnique({
      where: { email },
    });

    // 2. Check user exists and has a password set
    if (!user || !user.password) {
      await logAuthEvent(null, "LOGIN_FAILED", request, {
        reason: "EMAIL_NOT_FOUND",
        email,
      });
      throw new AuthInvalidCredentialsError();
    }

    // 3. Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      await logAuthEvent(user.mobile, "LOGIN_FAILED", request, {
        reason: "INVALID_PASSWORD",
        email,
      }, user.id);
      throw new AuthInvalidCredentialsError();
    }

    // 4. Check if account is active
    if (!user.isActive) {
      await logAuthEvent(user.mobile, "LOGIN_FAILED", request, {
        reason: "ACCOUNT_SUSPENDED",
        email,
      }, user.id);
      throw new AuthAccountSuspendedError();
    }

    // 5. Create auth session + generate tokens
    const authResult = await createAuthSessionAndTokens(user, request);

    // 6. Log successful login
    await logAuthEvent(user.mobile, "LOGIN_EMAIL", request, {
      email,
      authProvider: "EMAIL",
    }, user.id);

    return authResult;
  },
});
