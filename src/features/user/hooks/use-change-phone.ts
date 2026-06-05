/**
 * Purpose: 2-step mutation hook for changing phone number
 * Responsibility: Send OTP to new phone, then verify OTP to complete change
 * Important Notes:
 *   - Step 1: POST /api/user/change-phone with { newPhone } → sends OTP
 *   - Step 2: POST /api/user/change-phone/verify with { newPhone, otp } → verifies
 *   - Uses plain fetch (no TanStack Query)
 *   - On verify success: updates Zustand store + toast
 */

"use client";

import { useState, useCallback } from "react";
import { useAuthStore } from "@/stores/auth-store";
import { toast } from "sonner";
import { useTranslation } from "@/i18n/use-translation";
import type { ApiResponse, UserProfile } from "@/types";

export function useChangePhone() {
  const [step, setStep] = useState<1 | 2>(1);
  const [isSending, setIsSending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const { t } = useTranslation();

  const sendOtp = useCallback(
    async (newPhone: string, onSuccess?: () => void) => {
      setIsSending(true);
      try {
        const res = await fetch("/api/user/change-phone", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "same-origin",
          body: JSON.stringify({ newPhone }),
        });
        const json: ApiResponse<{ message: string }> = await res.json();
        if (!res.ok) throw new Error(json.message || "Error");
        setStep(2);
        toast.success(t("auth.otpSentTo").replace("{mobile}", ""));
        onSuccess?.();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : t("common.somethingWrong"));
      } finally {
        setIsSending(false);
      }
    },
    [t]
  );

  const verifyOtp = useCallback(
    async ({ newPhone, otp }: { newPhone: string; otp: string }, onSuccess?: () => void) => {
      setIsVerifying(true);
      try {
        const res = await fetch("/api/user/change-phone/verify", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "same-origin",
          body: JSON.stringify({ newPhone, otp }),
        });
        const json: ApiResponse<{ message: string }> = await res.json();
        if (!res.ok) throw new Error(json.message || "Error");

        const { setUser } = useAuthStore.getState();
        setUser({ phone: newPhone, mobile: newPhone } as Partial<UserProfile>);
        toast.success(t("profile.phoneChanged"));
        onSuccess?.();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : t("common.somethingWrong"));
      } finally {
        setIsVerifying(false);
      }
    },
    [t]
  );

  return {
    sendOtp,
    verifyOtp,
    step,
    setStep,
    isSending,
    isVerifying,
  };
}
