/**
 * Purpose: Toggle branch active status
 * Endpoint: PATCH /api/branches/[id]/toggle-active (ADMIN only)
 */

import { createApiHandler } from "@/lib/server/api-handler";
import { toggleActiveSchema } from "@/features/branch/validations/branch";
import {
  toggleBranchActive,
  requireAdmin,
  extractBranchIdFromUrl,
} from "@/features/branch/services/branch-service";
import type { ToggleActiveInput } from "@/features/branch/validations/branch";

export const PATCH = createApiHandler<ToggleActiveInput, ReturnType<typeof toggleBranchActive>>({
  schema: toggleActiveSchema,
  authHook: requireAdmin,
  handler: async ({ request }) => {
    const id = extractBranchIdFromUrl(request.url);
    return toggleBranchActive(id);
  },
  successMessage: "शाखा की स्थिति सफलतापूर्वक बदली गई। / Branch status toggled successfully.",
});
