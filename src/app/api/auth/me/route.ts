/**
 * Purpose: Get current authenticated user API endpoint
 * Responsibility: Return current user profile based on JWT token
 *
 * Endpoint: GET /api/auth/me
 *
 * OpenAPI Summary: Get current authenticated user profile
 * OpenAPI Description: Returns the profile of the currently authenticated user.
 *   Verifies JWT token, checks session validity, and confirms user is active.
 *
 * Security: BearerAuth (JWT access token)
 *
 * Responses:
 *   200: { success: true, data: { user } }
 *   401: { success: false, error: "AUTH_MISSING_TOKEN"|"AUTH_INVALID_TOKEN"|"AUTH_SESSION_INVALID"|"AUTH_ACCOUNT_SUSPENDED", message, statusCode: 401 }
 *   404: { success: false, error: "RES_NOT_FOUND", message, statusCode: 404 }
 */

import { createApiHandler } from "@/lib/api-handler";
import { requireActiveUser } from "@/lib/auth-helpers";

export const GET = createApiHandler({
  schema: null, // No body — token from Authorization header
  handler: async ({ request }) => {
    // 1. Verify token + check session + check user active (all in one call)
    const { user } = await requireActiveUser(request);

    return { user };
  },
});
