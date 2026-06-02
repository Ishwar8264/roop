/**
 * Purpose: Staff leave list + add endpoints
 * Endpoints:
 *   GET  /api/staff/[id]/leaves  — List leaves (public)
 *   POST /api/staff/[id]/leaves  — Add leave (ADMIN only)
 */

import { createApiHandler } from "@/lib/server/api-handler";
import { addStaffLeaveSchema } from "@/features/staff/validations/staff";
import {
  listStaffLeaves,
  addStaffLeave,
  requireAdmin,
  extractStaffIdFromUrl,
} from "@/features/staff/services/staff-service";
import type { AddStaffLeaveInput } from "@/features/staff/validations/staff";

// ==================== GET — LIST LEAVES (PUBLIC) ====================

export const GET = createApiHandler<null, ReturnType<typeof listStaffLeaves>>({
  schema: null,
  handler: async ({ request }) => {
    const staffId = extractStaffIdFromUrl(request.url);
    const url = new URL(request.url);
    const year = url.searchParams.get("year")
      ? parseInt(url.searchParams.get("year")!, 10)
      : undefined;
    const month = url.searchParams.get("month")
      ? parseInt(url.searchParams.get("month")!, 10)
      : undefined;

    // Validate year/month if provided
    if (year !== undefined && (isNaN(year) || year < 2000 || year > 2100)) {
      return listStaffLeaves(staffId, {});
    }
    if (month !== undefined && (isNaN(month) || month < 1 || month > 12)) {
      return listStaffLeaves(staffId, { year });
    }

    return listStaffLeaves(staffId, { year, month });
  },
  successMessage: "छुट्टियाँ सफलतापूर्वक प्राप्त हुईं। / Staff leaves fetched successfully.",
});

// ==================== POST — ADD LEAVE (ADMIN ONLY) ====================

export const POST = createApiHandler<AddStaffLeaveInput, ReturnType<typeof addStaffLeave>>({
  schema: addStaffLeaveSchema,
  authHook: requireAdmin,
  handler: async ({ parsedBody, request }) => {
    const staffId = extractStaffIdFromUrl(request.url);
    return addStaffLeave(staffId, parsedBody);
  },
  successMessage: "छुट्टी सफलतापूर्वक जोड़ी गई। / Staff leave added successfully.",
  successStatus: 201,
});
