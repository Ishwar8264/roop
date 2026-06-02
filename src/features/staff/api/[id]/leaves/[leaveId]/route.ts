/**
 * Purpose: Remove staff leave endpoint
 * Endpoint: DELETE /api/staff/[id]/leaves/[leaveId] (ADMIN only)
 */

import { createApiHandler } from "@/lib/server/api-handler";
import {
  removeStaffLeave,
  requireAdmin,
  extractStaffIdFromUrl,
  extractLeaveIdFromUrl,
} from "@/features/staff/services/staff-service";

export const DELETE = createApiHandler<null, ReturnType<typeof removeStaffLeave>>({
  schema: null,
  authHook: requireAdmin,
  handler: async ({ request }) => {
    const staffId = extractStaffIdFromUrl(request.url);
    const leaveId = extractLeaveIdFromUrl(request.url);
    return removeStaffLeave(staffId, leaveId);
  },
  successMessage: "छुट्टी सफलतापूर्वक हटाई गई। / Staff leave removed successfully.",
});
