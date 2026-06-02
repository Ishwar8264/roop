/**
 * Purpose: Branch holiday list + add endpoints
 * Endpoints:
 *   GET  /api/branches/[id]/holidays  — List holidays (public)
 *   POST /api/branches/[id]/holidays  — Add holiday (ADMIN only)
 */

import { createApiHandler } from "@/lib/server/api-handler";
import { addHolidaySchema } from "@/features/branch/validations/branch";
import {
  listHolidays,
  addHoliday,
  requireAdmin,
  extractBranchIdFromUrl,
} from "@/features/branch/services/branch-service";
import type { AddHolidayInput } from "@/features/branch/validations/branch";

// ==================== GET — LIST HOLIDAYS (PUBLIC) ====================

export const GET = createApiHandler<null, ReturnType<typeof listHolidays>>({
  schema: null,
  handler: async ({ request }) => {
    const id = extractBranchIdFromUrl(request.url);
    const url = new URL(request.url);
    const year = url.searchParams.get("year")
      ? parseInt(url.searchParams.get("year")!, 10)
      : undefined;
    const month = url.searchParams.get("month")
      ? parseInt(url.searchParams.get("month")!, 10)
      : undefined;

    // Validate year/month if provided
    if (year !== undefined && (isNaN(year) || year < 2000 || year > 2100)) {
      return listHolidays(id, {});
    }
    if (month !== undefined && (isNaN(month) || month < 1 || month > 12)) {
      return listHolidays(id, { year });
    }

    return listHolidays(id, { year, month });
  },
  successMessage: "छुट्टियाँ सफलतापूर्वक प्राप्त हुईं। / Holidays fetched successfully.",
});

// ==================== POST — ADD HOLIDAY (ADMIN ONLY) ====================

export const POST = createApiHandler<AddHolidayInput, ReturnType<typeof addHoliday>>({
  schema: addHolidaySchema,
  authHook: requireAdmin,
  handler: async ({ parsedBody, request }) => {
    const id = extractBranchIdFromUrl(request.url);
    return addHoliday(id, parsedBody);
  },
  successMessage: "छुट्टी सफलतापूर्वक जोड़ी गई। / Holiday added successfully.",
  successStatus: 201,
});
