/**
 * Purpose: Staff list + create endpoints
 * Endpoints:
 *   GET  /api/staff  — List staff (public)
 *   POST /api/staff  — Create staff profile (ADMIN only)
 */

import { createApiHandler } from "@/lib/server/api-handler";
import { createStaffSchema } from "@/features/staff/validations/staff";
import {
  listStaff,
  createStaff,
  requireAdmin,
} from "@/features/staff/services/staff-service";
import type { CreateStaffInput } from "@/features/staff/validations/staff";

// ==================== GET — LIST STAFF (PUBLIC) ====================

export const GET = createApiHandler<null, ReturnType<typeof listStaff>>({
  schema: null,
  handler: async ({ request }) => {
    const url = new URL(request.url);
    const branchId = url.searchParams.get("branchId") || undefined;
    const specialization = url.searchParams.get("specialization") || undefined;
    const isAvailableParam = url.searchParams.get("isAvailable");
    const isAvailable = isAvailableParam !== null
      ? isAvailableParam === "true"
      : undefined;
    const page = parseInt(url.searchParams.get("page") || "1", 10);
    const limit = parseInt(url.searchParams.get("limit") || "20", 10);

    // Validate pagination params
    const validPage = Math.max(1, isNaN(page) ? 1 : page);
    const validLimit = Math.min(100, Math.max(1, isNaN(limit) ? 20 : limit));

    return listStaff({
      branchId,
      specialization,
      isAvailable,
      page: validPage,
      limit: validLimit,
    });
  },
  successMessage: "स्टाफ सफलतापूर्वक प्राप्त हुए। / Staff fetched successfully.",
});

// ==================== POST — CREATE STAFF (ADMIN ONLY) ====================

export const POST = createApiHandler<CreateStaffInput, ReturnType<typeof createStaff>>({
  schema: createStaffSchema,
  authHook: requireAdmin,
  handler: async ({ parsedBody }) => {
    return createStaff(parsedBody);
  },
  successMessage: "स्टाफ सफलतापूर्वक बनाया गया। / Staff created successfully.",
  successStatus: 201,
});
