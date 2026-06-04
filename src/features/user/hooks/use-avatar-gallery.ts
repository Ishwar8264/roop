/**
 * Purpose: React Query hook to fetch user's avatar gallery from Cloudinary
 * Responsibility: Fetch and cache gallery images for the avatar dialog
 * Important Notes:
 *   - Caches for 2 minutes (staleTime)
 *   - Returns typed gallery image data
 *   - Uses apiClient for authenticated requests
 */

"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/services/api-client";
import type { ApiResponse } from "@/types";

export interface GalleryImage {
  url: string;
  publicId: string;
  width: number;
  height: number;
  format: string;
  createdAt: string;
}

interface GalleryData {
  images: GalleryImage[];
}

export function useAvatarGallery() {
  return useQuery({
    queryKey: ["avatar-gallery"],
    queryFn: async () => {
      const res = await apiClient.get<ApiResponse<GalleryData>>("/user/avatar/gallery");
      return res.data;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    enabled: false, // Only fetch when explicitly triggered (on tab switch)
  });
}
