/**
 * Purpose: React Query mutation to deactivate user account
 * Responsibility: Deactivate account via POST /api/user/deactivate
 * Important Notes:
 *   - On success: Zustand logout() + redirect to /login + toast
 *   - Requires confirmation text "DELETE_MY_ACCOUNT"
 */

"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { apiClient } from "@/services/api-client";
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
  const { t } = useTranslation();

  return useMutation({
    mutationFn: async (payload: DeactivatePayload) => {
      const res = await apiClient.post<ApiResponse<{ message: string }>>(
        "/user/deactivate",
        payload
      );
      return res;
    },
    onSuccess: () => {
      toast.success(t("profile.accountDeactivated"));

      // Logout from Zustand store
      useAuthStore.getState().logout();

      // Redirect to login page
      setTimeout(() => {
        router.push("/login");
      }, 1500);
    },
    onError: (error: Error) => {
      toast.error(error.message || t("common.somethingWrong"));
    },
  });
}
