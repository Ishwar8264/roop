/**
 * Purpose: Branch list + create endpoints
 * Endpoints:
 *   GET  /api/branches  — List branches (public)
 *   POST /api/branches  — Create branch (ADMIN only)
 */

import { createApiHandler } from "@/lib/server/api-handler";
import { createBranchSchema } from "@/features/branch/validations/branch";
import {
  listBranches,
  createBranch,
  requireAdmin,
} from "@/features/branch/services/branch-service";
import type { CreateBranchInput } from "@/features/branch/validations/branch";

// ==================== GET — LIST BRANCHES (PUBLIC) ====================

export const GET = createApiHandler<null, ReturnType<typeof listBranches>>({
  schema: null,
  handler: async ({ request }) => {
    const url = new URL(request.url);
    const city = url.searchParams.get("city") || undefined;
    const includeInactive = url.searchParams.get("includeInactive") === "true";
    const page = parseInt(url.searchParams.get("page") || "1", 10);
    const limit = parseInt(url.searchParams.get("limit") || "20", 10);

    // Validate pagination params
    const validPage = Math.max(1, isNaN(page) ? 1 : page);
    const validLimit = Math.min(100, Math.max(1, isNaN(limit) ? 20 : limit));

    return listBranches({
      city,
      includeInactive,
      page: validPage,
      limit: validLimit,
    });
  },
  successMessage: "शाखाएँ सफलतापूर्वक प्राप्त हुईं। / Branches fetched successfully.",
});

// ==================== POST — CREATE BRANCH (ADMIN ONLY) ====================

export const POST = createApiHandler<CreateBranchInput, ReturnType<typeof createBranch>>({
  schema: createBranchSchema,
  authHook: requireAdmin,
  handler: async ({ parsedBody }) => {
    return createBranch(parsedBody);
  },
  successMessage: "शाखा सफलतापूर्वक बनाई गई। / Branch created successfully.",
  successStatus: 201,
});
