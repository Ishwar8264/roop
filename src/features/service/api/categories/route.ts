/**
 * Purpose: Service category list + create endpoints
 * Endpoints:
 *   GET  /api/service-categories  — List categories (public)
 *   POST /api/service-categories  — Create category (ADMIN only)
 */

import { createApiHandler } from "@/lib/server/api-handler";
import { createServiceCategorySchema } from "@/features/service/validations/service";
import {
  listServiceCategories,
  createServiceCategory,
  requireAdmin,
} from "@/features/service/services/service-service";
import type { CreateServiceCategoryInput } from "@/features/service/validations/service";

// ==================== GET — LIST CATEGORIES (PUBLIC) ====================

export const GET = createApiHandler<null, ReturnType<typeof listServiceCategories>>({
  schema: null,
  handler: async ({ request }) => {
    const url = new URL(request.url);
    const includeInactive = url.searchParams.get("includeInactive") === "true";

    return listServiceCategories({
      includeInactive,
    });
  },
  successMessage: "सेवा श्रेणियाँ सफलतापूर्वक प्राप्त हुईं। / Service categories fetched successfully.",
});

// ==================== POST — CREATE CATEGORY (ADMIN ONLY) ====================

export const POST = createApiHandler<CreateServiceCategoryInput, ReturnType<typeof createServiceCategory>>({
  schema: createServiceCategorySchema,
  authHook: requireAdmin,
  handler: async ({ parsedBody }) => {
    return createServiceCategory(parsedBody);
  },
  successMessage: "सेवा श्रेणी सफलतापूर्वक बनाई गई। / Service category created successfully.",
  successStatus: 201,
});
