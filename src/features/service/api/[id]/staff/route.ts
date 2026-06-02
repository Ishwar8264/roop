/**
 * Purpose: Staff by service reverse lookup endpoint
 * Endpoint:
 *   GET /api/services/[id]/staff — List staff who can perform a service (public)
 *
 * Critical for booking flow: user selects service → sees available staff
 */

import { createApiHandler } from "@/lib/server/api-handler";
import {
  listStaffByService,
  extractServiceIdFromServiceUrl,
} from "@/features/staff/services/staff-service";

// ==================== GET — LIST STAFF BY SERVICE (PUBLIC) ====================

export const GET = createApiHandler<null, ReturnType<typeof listStaffByService>>({
  schema: null,
  handler: async ({ request }) => {
    const serviceId = extractServiceIdFromServiceUrl(request.url);
    return listStaffByService(serviceId);
  },
  successMessage: "सेवा के लिए स्टाफ सफलतापूर्वक प्राप्त हुए। / Staff for service fetched successfully.",
});
