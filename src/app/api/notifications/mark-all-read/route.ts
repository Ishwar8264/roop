/**
 * Purpose: Mark all user's notifications as read
 * Responsibility: Bulk update all PENDING notifications to SENT status
 *
 * Endpoint: POST /api/notifications/mark-all-read
 * Auth: Any authenticated user (own notifications only)
 */

import { createApiHandler } from "@/lib/api-handler";
import { prisma } from "@/lib/prisma";
import { requireActiveUser } from "@/lib/auth-helpers";

export const POST = createApiHandler({
  schema: null,
  successMessage: "All notifications marked as read.",
  handler: async ({ request }) => {
    const { user } = await requireActiveUser(request);

    // Bulk update: set all PENDING notifications for this user to SENT
    const now = new Date();
    const result = await prisma.notification.updateMany({
      where: {
        userId: user.id,
        status: "PENDING",
      },
      data: {
        status: "SENT",
        sentAt: now,
      },
    });

    return { count: result.count };
  },
});
