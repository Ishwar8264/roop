/**
 * Purpose: Staff slot availability endpoint
 * Endpoints:
 *   GET /api/staff/[id]/slots — Get available slots for a specific staff member (public)
 *
 * Query params:
 *   date (required) — YYYY-MM-DD format
 *   serviceId (required) — needed for duration calculation
 *   variantId (optional) — use variant duration instead
 */

import { createApiHandler } from "@/lib/server/api-handler";
import {
  getStaffSlots,
  extractStaffIdFromUrl,
} from "@/features/booking/services/slot-service";
import { SlotServiceRequiredError } from "@/lib/server/errors";

// ==================== GET — STAFF SLOTS (PUBLIC) ====================

export const GET = createApiHandler<null, Awaited<ReturnType<typeof getStaffSlots>>>({
  schema: null,
  handler: async ({ request }) => {
    const staffId = extractStaffIdFromUrl(request.url);
    const url = new URL(request.url);

    const date = url.searchParams.get("date");
    const serviceId = url.searchParams.get("serviceId");
    const variantId = url.searchParams.get("variantId") || undefined;

    // Validate required params
    if (!date) {
      throw new SlotServiceRequiredError();
    }
    if (!serviceId) {
      throw new SlotServiceRequiredError();
    }

    // Validate date format (basic check)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      throw new SlotServiceRequiredError();
    }

    return getStaffSlots(staffId, {
      date,
      serviceId,
      variantId,
    });
  },
  successMessage: "स्टाफ स्लॉट उपलब्धता सफलतापूर्वक प्राप्त हुई। / Staff slot availability fetched successfully.",
});
