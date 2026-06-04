/**
 * Purpose: Fetch user's avatar images from Cloudinary gallery
 * Endpoint: GET /api/user/avatar/gallery
 *
 * Flow:
 *   1. Require auth (requireAuthWithSession)
 *   2. Fetch resources from Cloudinary using folder prefix
 *   3. Return list of image URLs with metadata
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAuthWithSession } from "@/features/auth/services/session-service";
import { v2 as cloudinary } from "cloudinary";
import { isAppError, toAppError } from "@/lib/server/errors";
import { HTTP_STATUS } from "@/shared/constants";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export async function GET(request: NextRequest) {
  try {
    const { user } = await requireAuthWithSession(request);

    // Fetch resources from the user's avatar folder in Cloudinary
    const folderPath = `nikharta-roop/avatars`;

    const result = await cloudinary.api.resources({
      type: "upload",
      prefix: folderPath,
      max_results: 30,
    });

    // Filter to only this user's avatars and format response
    const userPrefix = `avatar_${user.id}`;
    const images = result.resources
      .filter((resource: { public_id: string }) =>
        resource.public_id.includes(userPrefix) ||
        resource.public_id === `${folderPath}/${userPrefix}`
      )
      .map((resource: { secure_url: string; public_id: string; width: number; height: number; format: string; created_at: string }) => ({
        url: resource.secure_url,
        publicId: resource.public_id,
        width: resource.width,
        height: resource.height,
        format: resource.format,
        createdAt: resource.created_at,
      }));

    return NextResponse.json(
      {
        success: true,
        data: { images },
        message: "Gallery fetched successfully.",
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
    console.error("[UNHANDLED_ERROR_AVATAR_GALLERY]", error);
    return NextResponse.json(
      { success: false, error: appError.code, message: appError.message, statusCode: appError.statusCode },
      { status: appError.statusCode }
    );
  }
}
