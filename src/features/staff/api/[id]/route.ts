/**
 * Purpose: Staff get/update/delete endpoints
 * Endpoints:
 *   GET    /api/staff/[id]  — Get staff detail (public)
 *   PATCH  /api/staff/[id]  — Update staff (ADMIN only)
 *   DELETE /api/staff/[id]  — Soft deactivate staff (ADMIN only)
 */

import { createApiHandler } from "@/lib/server/api-handler";
import { updateStaffSchema } from "@/features/staff/validations/staff";
import {
  getStaffById,
  updateStaff,
  deactivateStaff,
  requireAdmin,
  extractStaffIdFromUrl,
} from "@/features/staff/services/staff-service";
import type { UpdateStaffInput } from "@/features/staff/validations/staff";

// ==================== GET — SINGLE STAFF (PUBLIC) ====================

export const GET = createApiHandler<null, ReturnType<typeof getStaffById>>({
  schema: null,
  handler: async ({ request }) => {
    const id = extractStaffIdFromUrl(request.url);
    return getStaffById(id);
  },
  successMessage: "स्टाफ विवरण सफलतापूर्वक प्राप्त हुआ। / Staff details fetched successfully.",
});

// ==================== PATCH — UPDATE STAFF (ADMIN ONLY) ====================

export const PATCH = createApiHandler<UpdateStaffInput, ReturnType<typeof updateStaff>>({
  schema: updateStaffSchema,
  authHook: requireAdmin,
  handler: async ({ parsedBody, request }) => {
    const id = extractStaffIdFromUrl(request.url);
    return updateStaff(id, parsedBody);
  },
  successMessage: "स्टाफ सफलतापूर्वक अपडेट हुआ। / Staff updated successfully.",
});

// ==================== DELETE — DEACTIVATE STAFF (ADMIN ONLY) ====================

export const DELETE = createApiHandler<null, ReturnType<typeof deactivateStaff>>({
  schema: null,
  authHook: requireAdmin,
  handler: async ({ request }) => {
    const id = extractStaffIdFromUrl(request.url);
    return deactivateStaff(id);
  },
  successMessage: "स्टाफ सफलतापूर्वक निष्क्रिय किया गया। / Staff deactivated successfully.",
});
