/**
 * Purpose: Upload/update user avatar
 * Endpoint: POST /api/user/avatar
 *
 * Flow:
 *   1. Require auth (requireAuthWithSession)
 *   2. Parse formData, get avatar file
 *   3. Validate: max 5MB, only JPEG/PNG/WebP
 *   4. Delete old avatar file if exists
 *   5. Save to /public/uploads/avatars/{userId}.{ext}
 *   6. Update user's avatarUrl in DB
 *   7. Return avatarUrl
 */

import { NextRequest, NextResponse } from "next/server";
import { writeFile, unlink } from "fs/promises";
import path from "path";
import { requireAuthWithSession } from "@/features/auth/services/session-service";
import { prisma } from "@/lib/database/prisma";
import {
  UserAvatarTooLargeError,
  UserAvatarInvalidTypeError,
  isAppError,
  toAppError,
} from "@/lib/server/errors";
import { HTTP_STATUS, ERROR_CODES } from "@/shared/constants";

const MAX_AVATAR_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];

const MIME_TO_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

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

    // Get current user to check for old avatar
    const currentUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { avatarUrl: true },
    });

    // Delete old avatar file if it exists
    if (currentUser?.avatarUrl) {
      const oldFilePath = path.join(process.cwd(), "public", currentUser.avatarUrl);
      try {
        await unlink(oldFilePath);
      } catch {
        // File might not exist (e.g., Cloudinary URL) — ignore
      }
    }

    // Save new file
    const ext = MIME_TO_EXT[avatarFile.type] || "jpg";
    const fileName = `${user.id}.${ext}`;
    const filePath = path.join(process.cwd(), "public", "uploads", "avatars", fileName);

    const fileBuffer = Buffer.from(await avatarFile.arrayBuffer());
    await writeFile(filePath, fileBuffer);

    const avatarUrl = `/uploads/avatars/${fileName}`;

    await prisma.user.update({
      where: { id: user.id },
      data: { avatarUrl },
    });

    return NextResponse.json(
      { success: true, data: { avatarUrl }, message: "Avatar uploaded successfully." },
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
    console.error("[UNHANDLED_ERROR]", error);
    return NextResponse.json(
      { success: false, error: appError.code, message: appError.message, statusCode: appError.statusCode },
      { status: appError.statusCode }
    );
  }
}
