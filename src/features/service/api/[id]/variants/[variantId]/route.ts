/**
 * Purpose: Service variant update/delete endpoints
 * Endpoints:
 *   PATCH  /api/services/[id]/variants/[variantId]  — Update variant (ADMIN only)
 *   DELETE /api/services/[id]/variants/[variantId]  — Soft delete variant (ADMIN only)
 */

import { createApiHandler } from "@/lib/server/api-handler";
import { updateServiceVariantSchema } from "@/features/service/validations/service";
import {
  updateServiceVariant,
  deactivateServiceVariant,
  requireAdmin,
  extractServiceIdFromUrl,
  extractVariantIdFromUrl,
} from "@/features/service/services/service-service";
import type { UpdateServiceVariantInput } from "@/features/service/validations/service";

// ==================== PATCH — UPDATE VARIANT (ADMIN ONLY) ====================

export const PATCH = createApiHandler<UpdateServiceVariantInput, ReturnType<typeof updateServiceVariant>>({
  schema: updateServiceVariantSchema,
  authHook: requireAdmin,
  handler: async ({ parsedBody, request }) => {
    const serviceId = extractServiceIdFromUrl(request.url);
    const variantId = extractVariantIdFromUrl(request.url);
    return updateServiceVariant(serviceId, variantId, parsedBody);
  },
  successMessage: "सेवा वेरिएंट सफलतापूर्वक अपडेट हुआ। / Service variant updated successfully.",
});

// ==================== DELETE — DEACTIVATE VARIANT (ADMIN ONLY) ====================

export const DELETE = createApiHandler<null, ReturnType<typeof deactivateServiceVariant>>({
  schema: null,
  authHook: requireAdmin,
  handler: async ({ request }) => {
    const serviceId = extractServiceIdFromUrl(request.url);
    const variantId = extractVariantIdFromUrl(request.url);
    return deactivateServiceVariant(serviceId, variantId);
  },
  successMessage: "सेवा वेरिएंट सफलतापूर्वक निष्क्रिय किया गया। / Service variant deactivated successfully.",
});
