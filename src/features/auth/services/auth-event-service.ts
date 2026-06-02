/**
 * Purpose: Auth event audit service — log all auth events
 * Responsibility: Create AuthEvent records for security audit trail
 * Important Notes:
 *   - Every login, logout, OTP, session event should be logged
 *   - Events are stored in PostgreSQL (permanent, queryable)
 *   - Used for security monitoring, compliance, and debugging
 */

import { prisma } from "@/lib/database/prisma";
import { parseUserAgent, extractClientIp, extractGeoFromIp } from "@/lib/server/device";
import type { NextRequest } from "next/server";
import type { AuthEventType } from "@/shared/types/enums";

// ==================== LOG AUTH EVENT ====================

/**
 * Log an auth event for audit trail
 * Call this after every significant auth action
 */
export async function logAuthEvent(
  event: AuthEventType,
  request: NextRequest,
  options?: {
    userId?: string;
    identifier?: string; // phone or email
    metadata?: Record<string, unknown>;
  }
): Promise<void> {
  try {
    const ip = extractClientIp(request);
    const geo = extractGeoFromIp(ip);
    const ua = request.headers.get("user-agent") || null;

    await prisma.authEvent.create({
      data: {
        userId: options?.userId || null,
        identifier: options?.identifier || null,
        event,
        ip,
        userAgent: ua,
        country: geo.country,
        metadata: options?.metadata ? JSON.parse(JSON.stringify(options.metadata)) : undefined,
      },
    });
  } catch (error) {
    // Audit logging should NEVER break the auth flow
    // Log error but don't throw
    console.error("[AUTH_EVENT_LOG_FAILED]", error);
  }
}
