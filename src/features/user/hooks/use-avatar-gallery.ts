/**
 * Purpose: Fetch user's avatar gallery from Cloudinary
 * Responsibility: Fetch gallery images for the avatar dialog
 * Important Notes:
 *   - Uses plain fetch (no TanStack Query)
 *   - Returns typed gallery image data
 *   - Manual trigger only (call refetch when needed)
 */

"use client";

import { useState, useCallback } from "react";
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
  const [data, setData] = useState<GalleryData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const refetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/user/avatar/gallery", {
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "same-origin",
      });
      const json: ApiResponse<GalleryData> = await res.json();
      if (!res.ok) throw new Error(json.message || "Error");
      setData(json.data ?? null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Unknown error"));
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { data, isLoading, error, refetch };
}
