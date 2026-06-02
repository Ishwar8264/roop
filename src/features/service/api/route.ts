/**
 * Purpose: Service list + create endpoints
 * Endpoints:
 *   GET  /api/services  — List services (public)
 *   POST /api/services  — Create service (ADMIN only)
 */

import { createApiHandler } from "@/lib/server/api-handler";
import { createServiceSchema } from "@/features/service/validations/service";
import {
  listServices,
  createService,
  requireAdmin,
} from "@/features/service/services/service-service";
import type { CreateServiceInput } from "@/features/service/validations/service";

// ==================== GET — LIST SERVICES (PUBLIC) ====================

export const GET = createApiHandler<null, ReturnType<typeof listServices>>({
  schema: null,
  handler: async ({ request }) => {
    const url = new URL(request.url);
    const branchId = url.searchParams.get("branchId") || undefined;
    const categoryId = url.searchParams.get("categoryId") || undefined;
    const includeInactive = url.searchParams.get("includeInactive") === "true";
    const page = parseInt(url.searchParams.get("page") || "1", 10);
    const limit = parseInt(url.searchParams.get("limit") || "20", 10);

    // Validate pagination params
    const validPage = Math.max(1, isNaN(page) ? 1 : page);
    const validLimit = Math.min(100, Math.max(1, isNaN(limit) ? 20 : limit));

    return listServices({
      branchId,
      categoryId,
      includeInactive,
      page: validPage,
      limit: validLimit,
    });
  },
  successMessage: "सेवाएँ सफलतापूर्वक प्राप्त हुईं। / Services fetched successfully.",
});

// ==================== POST — CREATE SERVICE (ADMIN ONLY) ====================

export const POST = createApiHandler<CreateServiceInput, ReturnType<typeof createService>>({
  schema: createServiceSchema,
  authHook: requireAdmin,
  handler: async ({ parsedBody }) => {
    return createService(parsedBody);
  },
  successMessage: "सेवा सफलतापूर्वक बनाई गई। / Service created successfully.",
  successStatus: 201,
});
