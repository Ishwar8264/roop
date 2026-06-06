/**
 * Purpose: Notifications list and send endpoints
 * Responsibility: List user's notifications + admin send notification
 *
 * Endpoints:
 *   GET  /api/notifications  — List user's notifications (paginated)
 *   POST /api/notifications  — Send notification (admin only)
 *
 * Auth:
 *   GET  — Any authenticated user (sees own notifications)
 *   POST — Admin only
 */

import { createApiHandler } from "@/lib/api-handler";
import { prisma } from "@/lib/prisma";
import { requireActiveUser } from "@/lib/auth-helpers";
import { AdminRequiredError as _AdminRequiredError, NotFoundError } from "@/lib/errors";
import { HTTP_STATUS } from "@/lib/http";
import {
  listNotificationsQuerySchema,
  sendNotificationSchema,
} from "@/lib/validations/notifications";

// ==================== GET — LIST NOTIFICATIONS ====================

export const GET = createApiHandler({
  schema: null,
  handler: async ({ request }) => {
    const { user } = await requireActiveUser(request);

    // Parse query params
    const url = new URL(request.url);
    const parsed = listNotificationsQuerySchema.safeParse(
      Object.fromEntries(url.searchParams)
    );

    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0];
      const fieldPath = firstIssue.path.join(".");
      return Response.json(
        {
          success: false,
          error: "VAL_INVALID_INPUT",
          message: fieldPath
            ? `${fieldPath}: ${firstIssue.message}`
            : firstIssue.message,
          statusCode: HTTP_STATUS.BAD_REQUEST,
        },
        { status: HTTP_STATUS.BAD_REQUEST }
      );
    }

    const { status, channel, page, pageSize } = parsed.data;

    // Build where clause — always filter by userId
    const where: Record<string, unknown> = {
      userId: user.id,
    };

    if (status) where.status = status;
    if (channel) where.channel = channel;

    // Fetch notifications + unread count in parallel
    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.notification.count({ where }),
      prisma.notification.count({
        where: { userId: user.id, status: "PENDING" },
      }),
    ]);

    return {
      notifications,
      unreadCount,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  },
});

// ==================== POST — SEND NOTIFICATION ====================

export const POST = createApiHandler({
  schema: sendNotificationSchema,
  successMessage: "Notification sent successfully.",
  successStatus: HTTP_STATUS.CREATED,
  handler: async ({ parsedBody }) => {
    const { userId, channel, title, message, trigger } = parsedBody;

    // Verify target user exists
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, isActive: true },
    });

    if (!targetUser) {
      throw new NotFoundError("Target user not found.");
    }

    // Create notification record
    const notification = await prisma.notification.create({
      data: {
        userId,
        channel,
        title,
        message,
        trigger: trigger || null,
        status: "PENDING",
      },
    });

    return notification;
  },
});
