/**
 * Purpose: Remove holiday endpoint
 * Endpoint: DELETE /api/branches/[id]/holidays/[holidayId] (ADMIN only)
 */

import { createApiHandler } from "@/lib/server/api-handler";
import {
  removeHoliday,
  requireAdmin,
  extractBranchIdFromUrl,
  extractHolidayIdFromUrl,
} from "@/features/branch/services/branch-service";

export const DELETE = createApiHandler<null, ReturnType<typeof removeHoliday>>({
  schema: null,
  authHook: requireAdmin,
  handler: async ({ request }) => {
    const branchId = extractBranchIdFromUrl(request.url);
    const holidayId = extractHolidayIdFromUrl(request.url);
    return removeHoliday(branchId, holidayId);
  },
  successMessage: "छुट्टी सफलतापूर्वक हटाई गई। / Holiday removed successfully.",
});
