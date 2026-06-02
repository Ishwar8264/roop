/**
 * Purpose: Alternative flat slot availability endpoint
 * Endpoints:
 *   GET /api/slots — Get available slots (flat endpoint with query params)
 *
 * Query params:
 *   branchId (required) — Which branch
 *   date (required) — YYYY-MM-DD format
 *   serviceId (required) — needed for duration calculation
 *   variantId (optional) — use variant duration instead
 *   staffId (optional) — filter for specific staff member
 *
 * This is an alternative to the nested routes:
 *   /api/branches/[id]/slots
 *   /api/staff/[id]/slots
 */

import { createApiHandler } from "@/lib/server/api-handler";
import { getBranchSlots } from "@/features/booking/services/slot-service";
import { SlotServiceRequiredError } from "@/lib/server/errors";

// ==================== GET — FLAT SLOTS (PUBLIC) ====================

export const GET = createApiHandler<null, Awaited<ReturnType<typeof getBranchSlots>>>({
  schema: null,
  handler: async ({ request }) => {
    const url = new URL(request.url);

    const branchId = url.searchParams.get("branchId");
    const date = url.searchParams.get("date");
    const serviceId = url.searchParams.get("serviceId");
    const variantId = url.searchParams.get("variantId") || undefined;
    const staffId = url.searchParams.get("staffId") || undefined;

    // Validate required params
    if (!branchId) {
      throw new SlotServiceRequiredError();
    }
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

    return getBranchSlots(branchId, {
      date,
      serviceId,
      variantId,
      staffId,
    });
  },
  successMessage: "स्लॉट उपलब्धता सफलतापूर्वक प्राप्त हुई। / Slot availability fetched successfully.",
});
