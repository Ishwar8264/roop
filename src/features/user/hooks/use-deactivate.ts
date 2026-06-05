/**
 * Purpose: Mutation hook to deactivate user account
 * Responsibility: Deactivate account via POST /api/user/deactivate
 * Important Notes:
 *   - Uses plain fetch (no TanStack Query)
 *   - On success: Zustand logout() + redirect to /login + toast
 *   - Requires confirmation text "DELETE_MY_ACCOUNT"
 */

"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth-store";
import { toast } from "sonner";
import { useTranslation } from "@/i18n/use-translation";
import type { ApiResponse } from "@/types";

interface DeactivatePayload {
  reason?: string;
  confirmation: "DELETE_MY_ACCOUNT";
}

export function useDeactivate() {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const { t } = useTranslation();

  const mutate = useCallback(
    async (payload: DeactivatePayload, onSuccess?: () => void) => {
      setIsPending(true);
      try {
        const token = useAuthStore.getState().token;
        const res = await fetch("/api/user/deactivate", {
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

        toast.success(t("profile.accountDeactivated"));
        useAuthStore.getState().logout();
        onSuccess?.();
        setTimeout(() => {
          router.push("/login");
        }, 1500);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : t("common.somethingWrong"));
      } finally {
        setIsPending(false);
      }
    },
    [router, t]
  );

  return { mutate, isPending };
}
