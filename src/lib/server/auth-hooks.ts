/**
 * Purpose: Shared authentication hooks for API routes
 * Responsibility: Reusable auth hooks that work with createApiHandler
 * Important Notes:
 *   - requireAuth: validates token + session + user is active (any role)
 *   - requireAdmin: validates token + session + role === 'ADMIN'
 *   - Import from here instead of defining locally in feature services
 *   - One change reflects everywhere — no divergent auth logic
 */

import { requireAuthWithSession } from "@/features/auth/services/session-service";
import { AdminRequiredError } from "@/lib/server/errors";
import type { NextRequest } from "next/server";

/**
 * Require authenticated user — auth hook for createApiHandler
 * Validates token + session + user is active (any role)
 */
export async function requireAuth(request: NextRequest) {
  const { payload, user } = await requireAuthWithSession(request);
  return { payload, user };
}

/**
 * Require admin role — auth hook for createApiHandler
 * Validates token + session + role === 'ADMIN'
 */
export async function requireAdmin(request: NextRequest) {
  const { payload, user } = await requireAuthWithSession(request);
  if (payload.role !== "ADMIN") {
    throw new AdminRequiredError();
  }
  return { payload, user };
}
