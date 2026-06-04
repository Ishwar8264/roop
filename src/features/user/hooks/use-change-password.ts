/**
 * Purpose: React Query mutation to change password
 * Responsibility: Change user password via POST /api/auth/change-password
 * Important Notes:
 *   - On success: shows toast notification
 *   - On error: shows error toast
 */

"use client";

import { useMutation } from "@tanstack/react-query";
import { apiClient } from "@/services/api-client";
import { toast } from "sonner";
import { useTranslation } from "@/i18n/use-translation";
import type { ApiResponse } from "@/types";

interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
}

export function useChangePassword() {
  const { t } = useTranslation();

  return useMutation({
    mutationFn: async (payload: ChangePasswordPayload) => {
      const res = await apiClient.post<ApiResponse<{ message: string }>>(
        "/auth/change-password",
        payload
      );
      return res;
    },
    onSuccess: () => {
      toast.success(t("profile.passwordChanged"));
    },
    onError: (error: Error) => {
      toast.error(error.message || t("common.somethingWrong"));
    },
  });
}
