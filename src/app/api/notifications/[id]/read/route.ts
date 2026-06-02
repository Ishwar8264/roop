/**
 * Purpose: Mark a single notification as read
 * Responsibility: Update notification status to SENT and set sentAt timestamp
 *
 * Endpoint: PATCH /api/notifications/[id]/read
 * Auth: Any authenticated user (own notification only)
 */

import { createApiHandler } from "@/lib/api-handler";
import { prisma } from "@/lib/prisma";
import { requireActiveUser } from "@/lib/auth-helpers";
import { NotFoundError, ForbiddenError } from "@/lib/errors";

export const PATCH = createApiHandler({
  schema: null,
  successMessage: "Notification marked as read.",
  handler: async ({ request }) => {
    const { user } = await requireActiveUser(request);

    // Extract notification ID from URL
    const url = new URL(request.url);
    const pathParts = url.pathname.split("/");
    const notificationId = pathParts[3]; // /api/notifications/[id]/read

    // Find the notification
    const notification = await prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification) {
      throw new NotFoundError("Notification not found.");
    }

    // User can only mark their own notifications as read
    if (notification.userId !== user.id) {
      throw new ForbiddenError("You can only mark your own notifications as read.");
    }

    // Already read? Just return it
    if (notification.status === "SENT" && notification.sentAt) {
      return notification;
    }

    // Mark as read: set status = SENT + sentAt = now
    const updated = await prisma.notification.update({
      where: { id: notificationId },
      data: {
        status: "SENT",
        sentAt: new Date(),
      },
    });

    return updated;
  },
});
