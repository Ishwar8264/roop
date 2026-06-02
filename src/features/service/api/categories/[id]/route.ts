/**
 * Purpose: Service category update/delete endpoints
 * Endpoints:
 *   PATCH  /api/service-categories/[id]  — Update category (ADMIN only)
 *   DELETE /api/service-categories/[id]   — Soft delete category (ADMIN only)
 */

import { createApiHandler } from "@/lib/server/api-handler";
import { updateServiceCategorySchema } from "@/features/service/validations/service";
import {
  updateServiceCategory,
  deactivateServiceCategory,
  requireAdmin,
  extractCategoryIdFromUrl,
} from "@/features/service/services/service-service";
import type { UpdateServiceCategoryInput } from "@/features/service/validations/service";

// ==================== PATCH — UPDATE CATEGORY (ADMIN ONLY) ====================

export const PATCH = createApiHandler<UpdateServiceCategoryInput, ReturnType<typeof updateServiceCategory>>({
  schema: updateServiceCategorySchema,
  authHook: requireAdmin,
  handler: async ({ parsedBody, request }) => {
    const id = extractCategoryIdFromUrl(request.url);
    return updateServiceCategory(id, parsedBody);
  },
  successMessage: "सेवा श्रेणी सफलतापूर्वक अपडेट हुई। / Service category updated successfully.",
});

// ==================== DELETE — DEACTIVATE CATEGORY (ADMIN ONLY) ====================

export const DELETE = createApiHandler<null, ReturnType<typeof deactivateServiceCategory>>({
  schema: null,
  authHook: requireAdmin,
  handler: async ({ request }) => {
    const id = extractCategoryIdFromUrl(request.url);
    return deactivateServiceCategory(id);
  },
  successMessage: "सेवा श्रेणी सफलतापूर्वक निष्क्रिय की गई। / Service category deactivated successfully.",
});
