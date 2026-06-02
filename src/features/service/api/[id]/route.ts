/**
 * Purpose: Service get/update/delete endpoints
 * Endpoints:
 *   GET    /api/services/[id]  — Get service detail (public)
 *   PATCH  /api/services/[id]  — Update service (ADMIN only)
 *   DELETE /api/services/[id]  — Soft delete service (ADMIN only)
 */

import { createApiHandler } from "@/lib/server/api-handler";
import { updateServiceSchema } from "@/features/service/validations/service";
import {
  getServiceById,
  updateService,
  deactivateService,
  requireAdmin,
  extractServiceIdFromUrl,
} from "@/features/service/services/service-service";
import type { UpdateServiceInput } from "@/features/service/validations/service";

// ==================== GET — SINGLE SERVICE (PUBLIC) ====================

export const GET = createApiHandler<null, ReturnType<typeof getServiceById>>({
  schema: null,
  handler: async ({ request }) => {
    const id = extractServiceIdFromUrl(request.url);
    return getServiceById(id);
  },
  successMessage: "सेवा विवरण सफलतापूर्वक प्राप्त हुआ। / Service details fetched successfully.",
});

// ==================== PATCH — UPDATE SERVICE (ADMIN ONLY) ====================

export const PATCH = createApiHandler<UpdateServiceInput, ReturnType<typeof updateService>>({
  schema: updateServiceSchema,
  authHook: requireAdmin,
  handler: async ({ parsedBody, request }) => {
    const id = extractServiceIdFromUrl(request.url);
    return updateService(id, parsedBody);
  },
  successMessage: "सेवा सफलतापूर्वक अपडेट हुई। / Service updated successfully.",
});

// ==================== DELETE — DEACTIVATE SERVICE (ADMIN ONLY) ====================

export const DELETE = createApiHandler<null, ReturnType<typeof deactivateService>>({
  schema: null,
  authHook: requireAdmin,
  handler: async ({ request }) => {
    const id = extractServiceIdFromUrl(request.url);
    return deactivateService(id);
  },
  successMessage: "सेवा सफलतापूर्वक निष्क्रिय की गई। / Service deactivated successfully.",
});
