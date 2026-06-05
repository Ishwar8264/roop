/**
 * Purpose: Mutation hook to change password
 * Responsibility: Change user password via POST /api/auth/change-password
 * Important Notes:
 *   - Uses plain fetch (no TanStack Query)
 *   - On success: shows toast notification
 *   - On error: shows error toast
 */

"use client";

import { useState, useCallback } from "react";
import { useAuthStore } from "@/stores/auth-store";
import { toast } from "sonner";
import { useTranslation } from "@/i18n/use-translation";
import type { ApiResponse } from "@/types";

interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
}

export function useChangePassword() {
  const [isPending, setIsPending] = useState(false);
  const { t } = useTranslation();

  const mutate = useCallback(
    async (payload: ChangePasswordPayload, onSuccess?: () => void) => {
      setIsPending(true);
      try {
        const token = useAuthStore.getState().token;
        const res = await fetch("/api/auth/change-password", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          credentials: "same-origin",
          body: JSON.stringify(payload),
        });
        const json: ApiResponse<{ message: string }> = await res.json();
        if (!res.ok) throw new Error(json.message || "Error");
        toast.success(t("profile.passwordChanged"));
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
