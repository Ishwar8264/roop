/**
 * Purpose: Branch get/update/delete endpoints
 * Endpoints:
 *   GET    /api/branches/[id]  — Get branch details (public)
 *   PATCH   /api/branches/[id]  — Update branch (ADMIN only)
 *   DELETE  /api/branches/[id]  — Soft delete / deactivate branch (ADMIN only)
 */

import { createApiHandler } from "@/lib/server/api-handler";
import { updateBranchSchema } from "@/features/branch/validations/branch";
import {
  getBranchById,
  updateBranch,
  deactivateBranch,
  requireAdmin,
  extractBranchIdFromUrl,
} from "@/features/branch/services/branch-service";
import type { UpdateBranchInput } from "@/features/branch/validations/branch";

// ==================== GET — SINGLE BRANCH (PUBLIC) ====================

export const GET = createApiHandler<null, ReturnType<typeof getBranchById>>({
  schema: null,
  handler: async ({ request }) => {
    const id = extractBranchIdFromUrl(request.url);
    return getBranchById(id);
  },
  successMessage: "शाखा विवरण सफलतापूर्वक प्राप्त हुआ। / Branch details fetched successfully.",
});

// ==================== PATCH — UPDATE BRANCH (ADMIN ONLY) ====================

export const PATCH = createApiHandler<UpdateBranchInput, ReturnType<typeof updateBranch>>({
  schema: updateBranchSchema,
  authHook: requireAdmin,
  handler: async ({ parsedBody, request }) => {
    const id = extractBranchIdFromUrl(request.url);
    return updateBranch(id, parsedBody);
  },
  successMessage: "शाखा सफलतापूर्वक अपडेट हुई। / Branch updated successfully.",
});

// ==================== DELETE — DEACTIVATE BRANCH (ADMIN ONLY) ====================

export const DELETE = createApiHandler<null, ReturnType<typeof deactivateBranch>>({
  schema: null,
  authHook: requireAdmin,
  handler: async ({ request }) => {
    const id = extractBranchIdFromUrl(request.url);
    return deactivateBranch(id);
  },
  successMessage: "शाखा सफलतापूर्वक निष्क्रिय की गई। / Branch deactivated successfully.",
});
