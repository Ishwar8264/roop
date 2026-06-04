/**
 * Purpose: React Query mutation to update user profile
 * Responsibility: Update name/email/phone via PATCH /api/user/profile
 * Important Notes:
 *   - On success: updates Zustand store via setUser()
 *   - On success: invalidates profile query to refetch fresh data
 *   - Shows success/error toast
 */

"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/services/api-client";
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
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: async (payload: UpdateProfilePayload) => {
      const res = await apiClient.patch<ApiResponse<{ user: UserProfile }>>(
        "/user/profile",
        payload
      );
      return res.data;
    },
    onSuccess: (data) => {
      // Update Zustand store
      const { setUser } = useAuthStore.getState();
      setUser(data.user as Partial<UserProfile>);

      // Invalidate profile query to refetch
      queryClient.invalidateQueries({ queryKey: ["profile"] });

      toast.success(t("profile.profileUpdated"));
    },
    onError: (error: Error) => {
      toast.error(error.message || t("common.somethingWrong"));
    },
  });
}
