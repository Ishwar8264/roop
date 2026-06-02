/**
 * Purpose: Staff leaves management API endpoints
 * Responsibility: List staff leaves (public) and add leave (admin)
 *
 * Endpoints:
 *   GET  /api/staff/[id]/leaves   — List leaves for a staff member (public)
 *   POST /api/staff/[id]/leaves   — Add a leave record (admin only)
 *
 * GET Response:
 *   200: { success: true, data: { leaves } }
 *   — Returns leave records ordered by date descending
 *
 * POST Request Body:
 *   { date: "YYYY-MM-DD", reason?: string }
 *   — Date must be unique per staff (one leave per day)
 *
 * POST Response:
 *   201: { success: true, data: leave, message }
 *
 * Error Responses:
 *   403: { success: false, error: "PERM_ADMIN_REQUIRED" }
 *   404: { success: false, error: "RES_NOT_FOUND" }
 *   409: { success: false, error: "RES_CONFLICT" } — duplicate date
 */

import { createApiHandler } from "@/lib/api-handler";
import { prisma } from "@/lib/prisma";
import { requireActiveUser } from "@/lib/auth-helpers";
import { NotFoundError, ConflictError, AdminRequiredError } from "@/lib/errors";
import { HTTP_STATUS } from "@/lib/http";
import { addLeaveSchema } from "@/lib/validations/staff";

// ==================== Helper — extract staff [id] from URL ====================

function extractStaffIdFromUrl(request: Request): string | null {
  const url = new URL(request.url);
  const segments = url.pathname.split("/");
  const staffIndex = segments.indexOf("staff");
  if (staffIndex === -1) return null;
  return segments[staffIndex + 1] || null;
}

// ==================== GET — List Staff Leaves (Public) ====================

export const GET = createApiHandler({
  schema: null,
  handler: async ({ request }) => {
    const staffId = extractStaffIdFromUrl(request);
    if (!staffId) {
      throw new NotFoundError("Staff not found");
    }

    // 1. Check staff exists
    const staff = await prisma.staff.findUnique({
      where: { id: staffId },
    });
    if (!staff) {
      throw new NotFoundError("Staff not found");
    }

    // 2. Fetch leaves ordered by date descending
    const leaves = await prisma.staffLeave.findMany({
      where: { staffId },
      orderBy: { date: "desc" },
    });

    // 3. Return with formatted dates
    return {
      leaves: leaves.map((l) => ({
        ...l,
        date: l.date.toISOString().split("T")[0],
      })),
    };
  },
});

// ==================== POST — Add Leave (Admin) ====================

export const POST = createApiHandler({
  schema: addLeaveSchema,
  successMessage: "Leave added successfully",
  successStatus: HTTP_STATUS.CREATED,
  handler: async ({ parsedBody, request }) => {
    const staffId = extractStaffIdFromUrl(request);
    if (!staffId) {
      throw new NotFoundError("Staff not found");
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

    const { date, reason } = parsedBody;

    // 3. Check for duplicate date (unique constraint: staffId + date)
    const existingLeave = await prisma.staffLeave.findUnique({
      where: {
        staffId_date: {
          staffId,
          date: new Date(date),
        },
      },
    });
    if (existingLeave) {
      throw new ConflictError("Leave already exists for this staff on this date");
    }

    // 4. Create leave record
    const leave = await prisma.staffLeave.create({
      data: {
        staffId,
        date: new Date(date),
        reason: reason ?? null,
      },
    });

    // 5. Return with formatted date
    return {
      ...leave,
      date: leave.date.toISOString().split("T")[0],
    };
  },
});
