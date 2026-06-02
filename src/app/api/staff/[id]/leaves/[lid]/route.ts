/**
 * Purpose: Staff leave deletion API endpoint
 * Responsibility: Remove a leave record (admin only)
 *
 * Endpoints:
 *   DELETE /api/staff/[id]/leaves/[lid]   — Remove a leave record (admin only)
 *
 * DELETE Response:
 *   200: { success: true, data: null, message }
 *
 * Error Responses:
 *   403: { success: false, error: "PERM_ADMIN_REQUIRED" }
 *   404: { success: false, error: "RES_NOT_FOUND" }
 */

import { createApiHandler } from "@/lib/api-handler";
import { prisma } from "@/lib/prisma";
import { requireActiveUser } from "@/lib/auth-helpers";
import { NotFoundError, AdminRequiredError } from "@/lib/errors";

// ==================== Helper — extract IDs from URL ====================

function extractIdsFromUrl(request: Request): { staffId: string | null; lid: string | null } {
  const url = new URL(request.url);
  const segments = url.pathname.split("/");
  const staffIndex = segments.indexOf("staff");
  const leavesIndex = segments.indexOf("leaves");

  const staffId = staffIndex !== -1 ? segments[staffIndex + 1] || null : null;
  const lid = leavesIndex !== -1 ? segments[leavesIndex + 1] || null : null;

  return { staffId, lid };
}

// ==================== DELETE — Remove Leave (Admin) ====================

export const DELETE = createApiHandler({
  schema: null,
  successMessage: "Leave removed successfully",
  handler: async ({ request }) => {
    const { staffId, lid } = extractIdsFromUrl(request);
    if (!staffId || !lid) {
      throw new NotFoundError("Invalid URL — staff ID or leave ID missing");
    }

    // 1. Verify admin access
    const { user } = await requireActiveUser(request);
    if (user.role !== "ADMIN") {
      throw new AdminRequiredError();
    }

    // 2. Check staff exists
    const staff = await prisma.staff.findUnique({
      where: { id: staffId },
    });
    if (!staff) {
      throw new NotFoundError("Staff not found");
    }

    // 3. Check leave exists and belongs to this staff
    const leave = await prisma.staffLeave.findFirst({
      where: {
        id: lid,
        staffId,
      },
    });
    if (!leave) {
      throw new NotFoundError("Leave record not found");
    }

    // 4. Delete the leave record
    await prisma.staffLeave.delete({
      where: { id: lid },
    });

    return null;
  },
});
