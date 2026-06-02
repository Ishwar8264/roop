/**
 * Purpose: Branch slot availability endpoint
 * Endpoints:
 *   GET /api/branches/[id]/slots — Get available slots for a branch (public)
 *
 * Query params:
 *   date (required) — YYYY-MM-DD format
 *   serviceId (required) — needed for duration calculation
 *   variantId (optional) — use variant duration instead
 *   staffId (optional) — filter for specific staff member
 */

import { createApiHandler } from "@/lib/server/api-handler";
import {
  getBranchSlots,
  extractBranchIdFromUrl,
} from "@/features/booking/services/slot-service";
import { SlotServiceRequiredError } from "@/lib/server/errors";

// ==================== GET — BRANCH SLOTS (PUBLIC) ====================

export const GET = createApiHandler<null, Awaited<ReturnType<typeof getBranchSlots>>>({
  schema: null,
  handler: async ({ request }) => {
    const branchId = extractBranchIdFromUrl(request.url);
    const url = new URL(request.url);

    const date = url.searchParams.get("date");
    const serviceId = url.searchParams.get("serviceId");
    const variantId = url.searchParams.get("variantId") || undefined;
    const staffId = url.searchParams.get("staffId") || undefined;

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

    return getBranchSlots(branchId, {
      date,
      serviceId,
      variantId,
      staffId,
    });
  },
  successMessage: "स्लॉट उपलब्धता सफलतापूर्वक प्राप्त हुई। / Slot availability fetched successfully.",
});
