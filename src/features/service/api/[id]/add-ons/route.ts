/**
 * Purpose: Service add-on list + create endpoints
 * Endpoints:
 *   GET  /api/services/[id]/add-ons  — List add-ons for a service (public)
 *   POST /api/services/[id]/add-ons  — Create add-on (ADMIN only)
 */

import { createApiHandler } from "@/lib/server/api-handler";
import { createServiceAddOnSchema } from "@/features/service/validations/service";
import {
  listServiceAddOns,
  createServiceAddOn,
  requireAdmin,
  extractServiceIdFromUrl,
} from "@/features/service/services/service-service";
import type { CreateServiceAddOnInput } from "@/features/service/validations/service";

// ==================== GET — LIST ADD-ONS (PUBLIC) ====================

export const GET = createApiHandler<null, ReturnType<typeof listServiceAddOns>>({
  schema: null,
  handler: async ({ request }) => {
    const serviceId = extractServiceIdFromUrl(request.url);
    return listServiceAddOns(serviceId);
  },
  successMessage: "सेवा ऐड-ऑन सफलतापूर्वक प्राप्त हुए। / Service add-ons fetched successfully.",
});

// ==================== POST — CREATE ADD-ON (ADMIN ONLY) ====================

export const POST = createApiHandler<CreateServiceAddOnInput, ReturnType<typeof createServiceAddOn>>({
  schema: createServiceAddOnSchema,
  authHook: requireAdmin,
  handler: async ({ parsedBody, request }) => {
    const serviceId = extractServiceIdFromUrl(request.url);
    return createServiceAddOn(serviceId, parsedBody);
  },
  successMessage: "सेवा ऐड-ऑन सफलतापूर्वक बनाया गया। / Service add-on created successfully.",
  successStatus: 201,
});
