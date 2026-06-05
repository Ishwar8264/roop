/**
 * Purpose: Upload avatar file to Cloudinary via API
 * Responsibility: Handle avatar upload with client-side validation
 * Important Notes:
 *   - Uses raw fetch (NOT apiClient) because FormData needs no Content-Type header
 *   - Client-side validation: max 5MB, JPEG/PNG/WebP only
 *   - On success: updates Zustand store avatarUrl + toast
 */

"use client";

import { useState, useCallback } from "react";
import { useAuthStore } from "@/stores/auth-store";
import { toast } from "sonner";
import { useTranslation } from "@/i18n/use-translation";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];

interface AvatarUploadResult {
  avatarUrl: string;
  thumbnailUrl: string;
}

export function useUploadAvatar() {
  const [isUploading, setIsUploading] = useState(false);
  const { t } = useTranslation();

  const upload = useCallback(
    async (file: File): Promise<AvatarUploadResult | null> => {
      // Client-side validation
      if (!ALLOWED_MIME_TYPES.includes(file.type)) {
        toast.error(t("profile.avatarHint"));
        return null;
      }

      if (file.size > MAX_FILE_SIZE) {
        toast.error(t("profile.avatarHint"));
        return null;
      }

      setIsUploading(true);

      try {
        const formData = new FormData();
        formData.append("avatar", file);

        const res = await fetch("/api/user/avatar", {
          method: "POST",
          body: formData,
          credentials: "same-origin",
        });

        const data = await res.json();

        if (!res.ok || !data.success) {
          throw new Error(data.message || "Upload failed");
        }

        // Update Zustand store with new avatar URL
        const { setUser } = useAuthStore.getState();
        setUser({ avatarUrl: data.data.avatarUrl } as Partial<import("@/types").UserProfile>);

        toast.success(t("profile.avatarUpdated"));

        return data.data as AvatarUploadResult;
      } catch (error) {
        const message = error instanceof Error ? error.message : t("common.somethingWrong");
        toast.error(message);
        return null;
      } finally {
        setIsUploading(false);
      }
    },
    [t]
  );

  return { upload, isUploading };
}
