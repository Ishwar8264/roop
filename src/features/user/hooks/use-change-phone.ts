/**
 * Purpose: 2-step mutation hook for changing phone number
 * Responsibility: Send OTP to new phone, then verify OTP to complete change
 * Important Notes:
 *   - Step 1: POST /api/user/change-phone with { newPhone } → sends OTP
 *   - Step 2: POST /api/user/change-phone/verify with { newPhone, otp } → verifies
 *   - Returns { sendOtp, verifyOtp, step, setStep }
 *   - On verify success: updates Zustand store + toast
 */

"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiClient } from "@/services/api-client";
import { useAuthStore } from "@/stores/auth-store";
import { toast } from "sonner";
import { useTranslation } from "@/i18n/use-translation";
import type { ApiResponse, UserProfile } from "@/types";

export function useChangePhone() {
  const [step, setStep] = useState<1 | 2>(1);
  const { t } = useTranslation();

  const sendOtp = useMutation({
    mutationFn: async (newPhone: string) => {
      const res = await apiClient.post<ApiResponse<{ message: string }>>(
        "/user/change-phone",
        { newPhone }
      );
      return res;
    },
    onSuccess: () => {
      setStep(2);
      toast.success(t("auth.otpSentTo").replace("{mobile}", ""));
    },
    onError: (error: Error) => {
      toast.error(error.message || t("common.somethingWrong"));
    },
  });

  const verifyOtp = useMutation({
    mutationFn: async ({ newPhone, otp }: { newPhone: string; otp: string }) => {
      const res = await apiClient.post<ApiResponse<{ message: string }>>(
        "/user/change-phone/verify",
        { newPhone, otp }
      );
      return res;
    },
    onSuccess: (_data, variables) => {
      // Update Zustand store with new phone
      const { setUser } = useAuthStore.getState();
      setUser({ mobile: variables.newPhone } as Partial<UserProfile>);

      toast.success(t("profile.phoneChanged"));
    },
    onError: (error: Error) => {
      toast.error(error.message || t("common.somethingWrong"));
    },
  });

  return {
    sendOtp,
    verifyOtp,
    step,
    setStep,
  };
}
