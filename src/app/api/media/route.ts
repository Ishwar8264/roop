/**
 * Purpose: Media assets API endpoint
 * Responsibility: Save media URL records (admin only)
 *
 * Endpoints:
 *   POST /api/media  — Save a media URL record (admin only)
 *
 * POST Request Body:
 *   url, ownerId, ownerType, altHi (opt), altEn (opt),
 *   mimeType (opt), fileSize (opt), sortOrder (opt, default 0)
 *
 * Responses:
 *   201: { success: true, data: mediaAsset, message }
 *   400: { success: false, error, message }
 *   403: { success: false, error: "PERM_ADMIN_REQUIRED" }
 *
 * Note: Since there IS a MediaAsset model in Prisma, we use it to store
 *       media records with polymorphic ownership (ownerId + ownerType).
 */

import { createApiHandler } from "@/lib/api-handler";
import { prisma } from "@/lib/prisma";
import { requireActiveUser } from "@/lib/auth-helpers";
import { AdminRequiredError } from "@/lib/errors";
import { HTTP_STATUS } from "@/lib/http";
import { saveMediaSchema } from "@/lib/validations/portfolio";

// ==================== POST — Save Media URL (Admin) ====================

export const POST = createApiHandler({
  schema: saveMediaSchema,
  successMessage: "Media asset saved successfully",
  successStatus: HTTP_STATUS.CREATED,
  handler: async ({ parsedBody, request }) => {
    // 1. Verify admin access
    const { user } = await requireActiveUser(request);
    if (user.role !== "ADMIN") {
      throw new AdminRequiredError();
    }

    const {
      url,
      ownerId,
      ownerType,
      altHi,
      altEn,
      mimeType,
      fileSize,
      sortOrder,
    } = parsedBody;

    // 2. Create media asset record
    const mediaAsset = await prisma.mediaAsset.create({
      data: {
        url,
        ownerId,
        ownerType,
        altHi: altHi || null,
        altEn: altEn || null,
        mimeType: mimeType || null,
        fileSize: fileSize || null,
        sortOrder,
      },
    });

    return mediaAsset;
  },
});
