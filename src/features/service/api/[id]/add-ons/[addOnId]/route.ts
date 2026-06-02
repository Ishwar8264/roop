/**
 * Purpose: Service add-on update/delete endpoints
 * Endpoints:
 *   PATCH  /api/services/[id]/add-ons/[addOnId]  — Update add-on (ADMIN only)
 *   DELETE /api/services/[id]/add-ons/[addOnId]  — Soft delete add-on (ADMIN only)
 */

import { createApiHandler } from "@/lib/server/api-handler";
import { updateServiceAddOnSchema } from "@/features/service/validations/service";
import {
  updateServiceAddOn,
  deactivateServiceAddOn,
  requireAdmin,
  extractServiceIdFromUrl,
  extractAddOnIdFromUrl,
} from "@/features/service/services/service-service";
import type { UpdateServiceAddOnInput } from "@/features/service/validations/service";

// ==================== PATCH — UPDATE ADD-ON (ADMIN ONLY) ====================

export const PATCH = createApiHandler<UpdateServiceAddOnInput, ReturnType<typeof updateServiceAddOn>>({
  schema: updateServiceAddOnSchema,
  authHook: requireAdmin,
  handler: async ({ parsedBody, request }) => {
    const serviceId = extractServiceIdFromUrl(request.url);
    const addOnId = extractAddOnIdFromUrl(request.url);
    return updateServiceAddOn(serviceId, addOnId, parsedBody);
  },
  successMessage: "सेवा ऐड-ऑन सफलतापूर्वक अपडेट हुआ। / Service add-on updated successfully.",
});

// ==================== DELETE — DEACTIVATE ADD-ON (ADMIN ONLY) ====================

export const DELETE = createApiHandler<null, ReturnType<typeof deactivateServiceAddOn>>({
  schema: null,
  authHook: requireAdmin,
  handler: async ({ request }) => {
    const serviceId = extractServiceIdFromUrl(request.url);
    const addOnId = extractAddOnIdFromUrl(request.url);
    return deactivateServiceAddOn(serviceId, addOnId);
  },
  successMessage: "सेवा ऐड-ऑन सफलतापूर्वक निष्क्रिय किया गया। / Service add-on deactivated successfully.",
});
