/**
 * Purpose: Zod validation schemas for staff API routes
 * Responsibility: Validate all staff, service assignment, and leave API inputs
 * Important Notes:
 *   - One schema per API endpoint
 *   - Export both schema and inferred type
 *   - Hindi-first error messages
 *   - Time strings validated as "HH:mm" format
 *   - Date strings validated as "YYYY-MM-DD" format
 *   - WorkDays JSON structure validated with all 7 day keys
 *   - Specialization: array of non-empty strings
 *   - Decimal fields (commissionRate) validated as numbers
 */

import { z } from "zod";

// ==================== SHARED PRIMITIVES ====================

/** Time string — "HH:mm" format (24-hour) */
const timeString = z
  .string()
  .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "समय HH:mm प्रारूप में होना चाहिए / Time must be in HH:mm format (e.g., 09:00)");

/** Date string — "YYYY-MM-DD" format */
const dateString = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "तारीख YYYY-MM-DD प्रारूप में होनी चाहिए / Date must be in YYYY-MM-DD format")
  .refine((val) => !isNaN(Date.parse(val)), { message: "अमान्य तारीख / Invalid date" });

/** Work days structure — all 7 days required with boolean values */
const workDaysSchema = z.object({
  mon: z.boolean(),
  tue: z.boolean(),
  wed: z.boolean(),
  thu: z.boolean(),
  fri: z.boolean(),
  sat: z.boolean(),
  sun: z.boolean(),
});

/** Specialization — array of non-empty strings */
const specializationSchema = z
  .array(
    z.string()
      .min(1, "विशेषज्ञता खाली नहीं हो सकती / Specialization cannot be empty")
      .max(100, "विशेषज्ञता 100 अक्षरों से कम होनी चाहिए / Specialization must be under 100 characters")
      .trim()
  )
  .min(1, "कम से कम एक विशेषज्ञता आवश्यक है / At least one specialization is required");

/** Commission rate — percentage (0-100) with up to 2 decimal places */
const commissionRateSchema = z
  .number()
  .min(0, "कमीशन दर 0 या अधिक होनी चाहिए / Commission rate must be 0 or greater")
  .max(100, "कमीशन दर 100 से कम होनी चाहिए / Commission rate must be at most 100");

// ==================== CREATE STAFF ====================

/** POST /api/staff */
const _createStaffSchema = z
  .object({
    userId: z
      .string()
      .min(1, "उपयोगकर्ता ID आवश्यक है / User ID is required"),
    branchId: z
      .string()
      .min(1, "शाखा ID आवश्यक है / Branch ID is required"),
    specialization: specializationSchema,
    experienceYears: z
      .number()
      .int("अनुभव पूर्णांक होना चाहिए / Experience must be an integer")
      .min(0, "अनुभव 0 या अधिक होना चाहिए / Experience must be 0 or greater")
      .max(60, "अनुभव 60 वर्ष से कम होना चाहिए / Experience must be at most 60 years")
      .optional(),
    bioHi: z
      .string()
      .max(1000, "परिचय 1000 अक्षरों से कम होना चाहिए / Bio must be under 1000 characters")
      .trim()
      .optional(),
    bioEn: z
      .string()
      .max(1000, "Bio must be under 1000 characters")
      .trim()
      .optional(),
    photoUrl: z
      .url("अमान्य URL / Invalid URL")
      .nullable()
      .optional(),
    workDays: workDaysSchema.optional(),
    workStart: timeString,
    workEnd: timeString,
    commissionRate: commissionRateSchema.optional(),
  })
  .refine((data) => data.workStart < data.workEnd, {
    message: "कार्य प्रारंभ समय कार्य समाप्ति से पहले होना चाहिए / Work start time must be before work end time",
    path: ["workStart"],
  });

export type CreateStaffInput = z.infer<typeof _createStaffSchema>;

// ==================== UPDATE STAFF ====================

/** PATCH /api/staff/[id] */
const _updateStaffSchema = z
  .object({
    branchId: z
      .string()
      .min(1, "शाखा ID आवश्यक है / Branch ID is required")
      .optional(),
    specialization: specializationSchema.optional(),
    experienceYears: z
      .number()
      .int("अनुभव पूर्णांक होना चाहिए / Experience must be an integer")
      .min(0, "अनुभव 0 या अधिक होना चाहिए / Experience must be 0 or greater")
      .max(60, "अनुभव 60 वर्ष से कम होना चाहिए / Experience must be at most 60 years")
      .optional(),
    bioHi: z
      .string()
      .max(1000, "परिचय 1000 अक्षरों से कम होना चाहिए / Bio must be under 1000 characters")
      .trim()
      .optional(),
    bioEn: z
      .string()
      .max(1000, "Bio must be under 1000 characters")
      .trim()
      .optional(),
    photoUrl: z
      .url("अमान्य URL / Invalid URL")
      .nullable()
      .optional(),
    workDays: workDaysSchema.optional(),
    workStart: timeString.optional(),
    workEnd: timeString.optional(),
    commissionRate: commissionRateSchema.optional(),
  })
  .refine(
    (data) => {
      // Only validate start/end time if both are provided
      if (data.workStart && data.workEnd) {
        return data.workStart < data.workEnd;
      }
      return true;
    },
    {
      message: "कार्य प्रारंभ समय कार्य समाप्ति से पहले होना चाहिए / Work start time must be before work end time",
      path: ["workStart"],
    }
  );

export type UpdateStaffInput = z.infer<typeof _updateStaffSchema>;

// ==================== ASSIGN SERVICES ====================

/** POST /api/staff/[id]/services — bulk assign */
const _assignServicesSchema = z.object({
  serviceIds: z
    .array(
      z.string().min(1, "सेवा ID आवश्यक है / Service ID is required")
    )
    .min(1, "कम से कम एक सेवा ID आवश्यक है / At least one service ID is required"),
});

export type AssignServicesInput = z.infer<typeof _assignServicesSchema>;

// ==================== ADD LEAVE ====================

/** POST /api/staff/[id]/leaves */
const _addStaffLeaveSchema = z.object({
  date: dateString,
  reason: z
    .string()
    .max(200, "कारण 200 अक्षरों से कम होना चाहिए / Reason must be under 200 characters")
    .trim()
    .optional(),
});

export type AddStaffLeaveInput = z.infer<typeof _addStaffLeaveSchema>;
