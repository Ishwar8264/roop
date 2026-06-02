/**
 * Purpose: Service variant list + create endpoints
 * Endpoints:
 *   GET  /api/services/[id]/variants  — List variants for a service (public)
 *   POST /api/services/[id]/variants  — Create variant (ADMIN only)
 */

import { createApiHandler } from "@/lib/server/api-handler";
import { createServiceVariantSchema } from "@/features/service/validations/service";
import {
  listServiceVariants,
  createServiceVariant,
  requireAdmin,
  extractServiceIdFromUrl,
} from "@/features/service/services/service-service";
import type { CreateServiceVariantInput } from "@/features/service/validations/service";

// ==================== GET — LIST VARIANTS (PUBLIC) ====================

export const GET = createApiHandler<null, ReturnType<typeof listServiceVariants>>({
  schema: null,
  handler: async ({ request }) => {
    const serviceId = extractServiceIdFromUrl(request.url);
    return listServiceVariants(serviceId);
  },
  successMessage: "सेवा वेरिएंट सफलतापूर्वक प्राप्त हुए। / Service variants fetched successfully.",
});

// ==================== POST — CREATE VARIANT (ADMIN ONLY) ====================

export const POST = createApiHandler<CreateServiceVariantInput, ReturnType<typeof createServiceVariant>>({
  schema: createServiceVariantSchema,
  authHook: requireAdmin,
  handler: async ({ parsedBody, request }) => {
    const serviceId = extractServiceIdFromUrl(request.url);
    return createServiceVariant(serviceId, parsedBody);
  },
  successMessage: "सेवा वेरिएंट सफलतापूर्वक बनाया गया। / Service variant created successfully.",
  successStatus: 201,
});
