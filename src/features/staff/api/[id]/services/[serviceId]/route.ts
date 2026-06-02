/**
 * Purpose: Remove service assignment from staff
 * Endpoint: DELETE /api/staff/[id]/services/[serviceId] (ADMIN only)
 */

import { createApiHandler } from "@/lib/server/api-handler";
import {
  removeStaffService,
  requireAdmin,
  extractStaffIdFromUrl,
  extractServiceIdFromStaffUrl,
} from "@/features/staff/services/staff-service";

export const DELETE = createApiHandler<null, ReturnType<typeof removeStaffService>>({
  schema: null,
  authHook: requireAdmin,
  handler: async ({ request }) => {
    const staffId = extractStaffIdFromUrl(request.url);
    const serviceId = extractServiceIdFromStaffUrl(request.url);
    return removeStaffService(staffId, serviceId);
  },
  successMessage: "सेवा असाइनमेंट सफलतापूर्वक हटाई गई। / Service assignment removed successfully.",
});
