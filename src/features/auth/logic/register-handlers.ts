/**
 * Purpose: Register form API handlers — pure logic, no UI
 * Responsibility: Handle OTP send/resend/verify for registration
 * Important Notes:
 *   - Returns structured results — form component decides UI behavior
 *   - All toast notifications handled here
 */

import { toast } from "sonner";
import { apiClient, ApiClientError } from "@/services/api-client";
import { useTranslation } from "@/i18n/use-translation";
import type { ApiResponse, SendOtpResponse, OTPVerifyResponse } from "@/types";
import type { RegisterDetailsForm, RegisterOtpForm, RegisterSuccessData } from "./auth-schemas";

// ==================== Result Types ====================

export interface RegisterSendOtpResult {
  success: boolean;
  devOtp?: string;
  mobileExistsError?: string;
}

export interface RegisterVerifyResult {
  success: boolean;
  data?: RegisterSuccessData;
}

// ==================== Handlers ====================

export function useRegisterHandlers() {
  const { t } = useTranslation();

  async function sendOtp(data: RegisterDetailsForm): Promise<RegisterSendOtpResult> {
    try {
      const res = await apiClient.post<ApiResponse<SendOtpResponse>>(
        "/auth/send-otp",
        { mobile: data.mobile, purpose: "REGISTER" }
      );
      if (res.success) {
        toast.success(t("auth.sendOtp"), { description: t("auth.otpSentTo", { mobile: data.mobile }) });
        return { success: true, devOtp: res.data?.devOtp };
      }
      return { success: false };
    } catch (err: unknown) {
      if (err instanceof ApiClientError && err.errorCode === "AUTH_MOBILE_EXISTS") {
        toast.error(t("auth.mobileAlreadyRegistered"), { description: err.message, duration: 6000 });
        return { success: false, mobileExistsError: err.message };
      }
      if (err instanceof ApiClientError && err.errorCode === "AUTH_EMAIL_EXISTS") {
        toast.error(t("auth.emailAlreadyRegistered"), { description: err.message, duration: 6000 });
        return { success: false };
      }
      const message = err instanceof ApiClientError ? err.message : t("common.somethingWrong");
      toast.error(t("common.error"), { description: message });
      return { success: false };
    }
  }

  async function resendOtp(mobile: string): Promise<RegisterSendOtpResult> {
    try {
      const res = await apiClient.post<ApiResponse<SendOtpResponse>>(
        "/auth/send-otp",
        { mobile, purpose: "REGISTER" }
      );
      if (res.success) {
        toast.success(t("auth.otpResent"), { description: t("auth.newOtpSentTo", { mobile }) });
        return { success: true, devOtp: res.data?.devOtp };
      }
      return { success: false };
    } catch (err: unknown) {
      const message = err instanceof ApiClientError ? err.message : t("common.somethingWrong");
      toast.error(t("common.error"), { description: message });
      return { success: false };
    }
  }

  async function verifyOtp(data: RegisterOtpForm, name: string, email: string): Promise<RegisterVerifyResult> {
    try {
      const res = await apiClient.post<ApiResponse<OTPVerifyResponse>>(
        "/auth/verify-otp",
        { mobile: data.mobile, otp: data.otp, purpose: "REGISTER", name, email }
      );
      if (res.success && res.data) {
        toast.success(t("auth.registerSuccess"), { description: t("auth.welcomeToNr") });
        return {
          success: true,
          data: { user: res.data.user, token: res.data.tokens.accessToken },
        };
      }
      return { success: false };
    } catch (err: unknown) {
      const message = err instanceof ApiClientError ? err.message : t("common.somethingWrong");
      toast.error(t("auth.registrationFailed"), { description: message });
      return { success: false };
    }
  }

  return { sendOtp, resendOtp, verifyOtp };
}
