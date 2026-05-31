/**
 * Purpose: Get unread notification count for current user
 * Responsibility: Count notifications with status=PENDING (unread)
 *
 * Endpoint: GET /api/notifications/unread-count
 * Auth: Any authenticated user
 */

import { createApiHandler } from "@/lib/api-handler";
import { prisma } from "@/lib/prisma";
import { requireActiveUser } from "@/lib/auth-helpers";

export const GET = createApiHandler({
  schema: null,
  handler: async ({ request }) => {
    const { user } = await requireActiveUser(request);

    // Count unread (PENDING) notifications
    const count = await prisma.notification.count({
      where: {
        userId: user.id,
        status: "PENDING",
      },
    });

    return { count };
  },
});
