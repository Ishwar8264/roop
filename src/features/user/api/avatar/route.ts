/**
 * Purpose: Upload/update user avatar via Cloudinary
 * Endpoint: POST /api/user/avatar
 *
 * Flow:
 *   1. Require auth (requireAuthWithSession)
 *   2. Parse formData, get avatar file
 *   3. Validate: max 5MB, only JPEG/PNG/WebP
 *   4. Delete old Cloudinary image if exists (extract public_id from URL)
 *   5. Upload to Cloudinary (nikharta-roop/avatars folder, face-detect crop)
 *   6. Update user's avatarUrl in DB with Cloudinary secure URL
 *   7. Return avatarUrl + thumbnailUrl
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAuthWithSession } from "@/features/auth/services/session-service";
import { prisma } from "@/lib/database/prisma";
import { uploadAvatar, deleteCloudinaryImage, extractPublicIdFromUrl } from "@/lib/server/cloudinary";
import {
  UserAvatarTooLargeError,
  UserAvatarInvalidTypeError,
  isAppError,
  toAppError,
} from "@/lib/server/errors";
import { HTTP_STATUS, ERROR_CODES } from "@/shared/constants";

const MAX_AVATAR_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];

export async function POST(request: NextRequest) {
  try {
    const { user } = await requireAuthWithSession(request);

    const formData = await request.formData();
    const avatarFile = formData.get("avatar");

    if (!avatarFile || !(avatarFile instanceof File)) {
      return NextResponse.json(
        { success: false, error: ERROR_CODES.VAL_INVALID_INPUT, message: "avatar: Avatar file is required.", statusCode: HTTP_STATUS.BAD_REQUEST },
        { status: HTTP_STATUS.BAD_REQUEST }
      );
    }

    if (!ALLOWED_MIME_TYPES.includes(avatarFile.type)) {
      throw new UserAvatarInvalidTypeError();
    }

    if (avatarFile.size > MAX_AVATAR_SIZE) {
      throw new UserAvatarTooLargeError();
    }

    // Get current user to check for old avatar (for Cloudinary cleanup)
    const currentUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { avatarUrl: true },
    });

    // Delete old Cloudinary image if it exists
    if (currentUser?.avatarUrl) {
      const oldPublicId = extractPublicIdFromUrl(currentUser.avatarUrl);
      if (oldPublicId) {
        // Don't await — fire and forget (non-blocking)
        deleteCloudinaryImage(oldPublicId).catch(() => {});
      }
    }

    // Upload to Cloudinary
    const fileBuffer = Buffer.from(await avatarFile.arrayBuffer());
    const result = await uploadAvatar(fileBuffer, user.id);

    // Update user's avatarUrl in DB with Cloudinary URL
    await prisma.user.update({
      where: { id: user.id },
      data: { avatarUrl: result.avatarUrl },
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          avatarUrl: result.avatarUrl,
          thumbnailUrl: result.thumbnailUrl,
        },
        message: "Avatar uploaded successfully.",
      },
      { status: HTTP_STATUS.OK }
    );
  } catch (error: unknown) {
    if (isAppError(error)) {
      return NextResponse.json(
        { success: false, error: error.code, message: error.message, statusCode: error.statusCode },
        { status: error.statusCode }
      );
    }
    const appError = toAppError(error);
    console.error("[UNHANDLED_ERROR_AVATAR]", error);
    return NextResponse.json(
      { success: false, error: appError.code, message: appError.message, statusCode: appError.statusCode },
      { status: appError.statusCode }
    );
  }
}
