/**
 * Purpose: Cloudinary upload utility for Nikharta Roop
 * Responsibility: Handle all image uploads to Cloudinary (avatars, portfolio, blog, etc.)
 * Important Notes:
 *   - Uses Cloudinary Node.js SDK v2
 *   - Uploads to organized folders: avatars/, portfolio/, blog/, services/
 *   - Auto-generates optimized transformations for avatars
 *   - Returns secure URL + public_id for DB storage
 *   - Supports destroying old images on re-upload
 *   - Environment variables: CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET
 */

import { v2 as cloudinary, UploadApiResponse, UploadApiOptions } from "cloudinary";

// ==================== Configuration ====================

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

// ==================== Types ====================

export interface CloudinaryUploadResult {
  /** Cloudinary public_id — used for deletion/transformations */
  publicId: string;
  /** Full HTTPS URL of the uploaded image */
  url: string;
  /** Width in pixels */
  width: number;
  /** Height in pixels */
  height: number;
  /** File format (jpg, png, webp, etc.) */
  format: string;
  /** File size in bytes */
  bytes: number;
}

export interface AvatarUploadResult extends CloudinaryUploadResult {
  /** Optimized avatar URL (square crop, face detection) */
  avatarUrl: string;
  /** Thumbnail URL (small, for nav/header) */
  thumbnailUrl: string;
}

// ==================== Folder Constants ====================

export const CLOUDINARY_FOLDERS = {
  AVATARS: "nikharta-roop/avatars",
  PORTFOLIO: "nikharta-roop/portfolio",
  BLOG: "nikharta-roop/blog",
  SERVICES: "nikharta-roop/services",
  BRANCHES: "nikharta-roop/branches",
  PRODUCTS: "nikharta-roop/products",
  OFFERS: "nikharta-roop/offers",
  GENERAL: "nikharta-roop/general",
} as const;

// ==================== Core Upload ====================

/**
 * Upload a file buffer to Cloudinary
 * @param fileBuffer - The file data as a Buffer
 * @param options - Cloudinary upload options (folder, public_id, etc.)
 * @returns Upload result with URL, publicId, dimensions
 */
export async function uploadToCloudinary(
  fileBuffer: Buffer,
  options: UploadApiOptions
): Promise<CloudinaryUploadResult> {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      options,
      (error, result: UploadApiResponse) => {
        if (error || !result) {
          reject(new Error(error?.message || "Cloudinary upload failed"));
          return;
        }
        resolve({
          publicId: result.public_id,
          url: result.secure_url,
          width: result.width,
          height: result.height,
          format: result.format,
          bytes: result.bytes,
        });
      }
    );
    uploadStream.end(fileBuffer);
  });
}

// ==================== Avatar Upload ====================

/**
 * Upload a user avatar to Cloudinary
 * - Auto-crops to square with face detection
 * - Generates optimized URLs for different sizes
 * - Uses public_id based on userId for easy overwrite
 *
 * @param fileBuffer - Image file data
 * @param userId - User ID (used as public_id for overwrite)
 * @returns Avatar URLs (full + thumbnail)
 */
export async function uploadAvatar(
  fileBuffer: Buffer,
  userId: string
): Promise<AvatarUploadResult> {
  // Upload with face-detection crop + square aspect
  const result = await uploadToCloudinary(fileBuffer, {
    folder: CLOUDINARY_FOLDERS.AVATARS,
    public_id: `avatar_${userId}`,
    overwrite: true, // Replace existing avatar for same user
    transformation: [
      {
        width: 400,
        height: 400,
        crop: "fill",
        gravity: "face",
        quality: "auto",
        fetch_format: "auto",
      },
    ],
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
    max_file_size: 5 * 1024 * 1024, // 5MB
  });

  // Generate thumbnail URL (100x100 for nav/header)
  const thumbnailUrl = cloudinary.url(result.publicId, {
    width: 100,
    height: 100,
    crop: "fill",
    gravity: "face",
    quality: "auto",
    fetch_format: "auto",
    secure: true,
  });

  return {
    ...result,
    avatarUrl: result.url,
    thumbnailUrl,
  };
}

// ==================== General Image Upload ====================

/**
 * Upload a general image to Cloudinary (portfolio, blog, services, etc.)
 * @param fileBuffer - Image file data
 * @param folder - Cloudinary folder (use CLOUDINARY_FOLDERS constants)
 * @param publicId - Optional custom public_id (auto-generated if not provided)
 * @returns Upload result with URL and metadata
 */
export async function uploadImage(
  fileBuffer: Buffer,
  folder: string = CLOUDINARY_FOLDERS.GENERAL,
  publicId?: string
): Promise<CloudinaryUploadResult> {
  const options: UploadApiOptions = {
    folder,
    overwrite: false,
    transformation: [
      { quality: "auto", fetch_format: "auto" },
    ],
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
    max_file_size: 10 * 1024 * 1024, // 10MB for general uploads
  };

  if (publicId) {
    options.public_id = publicId;
    options.overwrite = true;
  }

  return uploadToCloudinary(fileBuffer, options);
}

// ==================== Delete Image ====================

/**
 * Delete an image from Cloudinary by public_id
 * Used when replacing/removing images
 *
 * @param publicId - The Cloudinary public_id to delete
 * @returns true if deleted, false if not found or error
 */
export async function deleteCloudinaryImage(publicId: string): Promise<boolean> {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result.result === "ok";
  } catch {
    return false;
  }
}

// ==================== URL Helpers ====================

/**
 * Generate an optimized Cloudinary URL for an existing image
 * Useful for generating different sizes on the fly
 *
 * @param publicId - Cloudinary public_id
 * @param options - Transformation options (width, height, crop, etc.)
 * @returns Optimized HTTPS URL
 */
export function getOptimizedUrl(
  publicId: string,
  options: { width?: number; height?: number; crop?: string } = {}
): string {
  return cloudinary.url(publicId, {
    width: options.width || 400,
    height: options.height || 400,
    crop: options.crop || "fill",
    gravity: "face",
    quality: "auto",
    fetch_format: "auto",
    secure: true,
  });
}

/**
 * Extract public_id from a Cloudinary URL
 * Used when we need to delete/replace an existing image
 *
 * @param url - Full Cloudinary URL
 * @returns public_id or null if not a Cloudinary URL
 */
export function extractPublicIdFromUrl(url: string): string | null {
  try {
    // Match: https://res.cloudinary.com/{cloud_name}/image/upload/{transforms}/{folder}/{public_id}.{ext}
    const match = url.match(/\/image\/upload\/(?:v\d+\/)?(.+?)(?:\.[^.]+)?$/);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}
