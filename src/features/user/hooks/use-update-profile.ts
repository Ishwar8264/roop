/**
 * Purpose: Mutation hook to update user profile
 * Responsibility: Update name/email/phone via PATCH /api/user/profile
 * Important Notes:
 *   - Uses plain fetch (no TanStack Query)
 *   - On success: updates Zustand store via setUser()
 *   - Shows success/error toast
 */

"use client";

import { useState, useCallback } from "react";
import { useAuthStore } from "@/stores/auth-store";
import { toast } from "sonner";
import { useTranslation } from "@/i18n/use-translation";
import type { ApiResponse, UserProfile } from "@/types";

interface UpdateProfilePayload {
  name?: string;
  email?: string;
  phone?: string;
}

export function useUpdateProfile() {
  const [isPending, setIsPending] = useState(false);
  const { t } = useTranslation();

  const mutate = useCallback(
    async (payload: UpdateProfilePayload, onSuccess?: () => void) => {
      setIsPending(true);
      try {
        const res = await fetch("/api/user/profile", {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "same-origin",
          body: JSON.stringify(payload),
        });
        const json: ApiResponse<{ user: UserProfile }> = await res.json();
        if (!res.ok) throw new Error(json.message || "Error");

        const { setUser } = useAuthStore.getState();
        setUser(json.data!.user as Partial<UserProfile>);
        toast.success(t("profile.profileUpdated"));
        onSuccess?.();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : t("common.somethingWrong"));
      } finally {
        setIsPending(false);
      }
    },
    [t]
  );

  return { mutate, isPending };
}
