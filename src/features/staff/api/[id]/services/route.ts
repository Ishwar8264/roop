/**
 * Purpose: Staff service assignment list + bulk assign endpoints
 * Endpoints:
 *   GET  /api/staff/[id]/services  — List services a staff member can perform (public)
 *   POST /api/staff/[id]/services  — Bulk assign services to staff (ADMIN only)
 */

import { createApiHandler } from "@/lib/server/api-handler";
import { assignServicesSchema } from "@/features/staff/validations/staff";
import {
  listStaffServices,
  assignServices,
  requireAdmin,
  extractStaffIdFromUrl,
} from "@/features/staff/services/staff-service";
import type { AssignServicesInput } from "@/features/staff/validations/staff";

// ==================== GET — LIST STAFF SERVICES (PUBLIC) ====================

export const GET = createApiHandler<null, ReturnType<typeof listStaffServices>>({
  schema: null,
  handler: async ({ request }) => {
    const staffId = extractStaffIdFromUrl(request.url);
    return listStaffServices(staffId);
  },
  successMessage: "स्टाफ सेवाएँ सफलतापूर्वक प्राप्त हुईं। / Staff services fetched successfully.",
});

// ==================== POST — BULK ASSIGN SERVICES (ADMIN ONLY) ====================

export const POST = createApiHandler<AssignServicesInput, ReturnType<typeof assignServices>>({
  schema: assignServicesSchema,
  authHook: requireAdmin,
  handler: async ({ parsedBody, request }) => {
    const staffId = extractStaffIdFromUrl(request.url);
    return assignServices(staffId, parsedBody.serviceIds);
  },
  successMessage: "सेवाएँ सफलतापूर्वक असाइन की गईं। / Services assigned successfully.",
  successStatus: 201,
});
