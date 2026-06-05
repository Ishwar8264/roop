/**
 * Purpose: Login form API handlers — pure logic, no UI
 * Responsibility: Handle OTP send/resend/verify (phone + email) + email login
 * Important Notes:
 *   - Returns structured results — form component decides UI behavior
 *   - All toast notifications handled here (side effect)
 *   - Uses apiClient for HTTP calls
 */

import { toast } from "sonner";
import { apiClient, ApiClientError } from "@/services/api-client";
import { useTranslation } from "@/i18n/use-translation";
import type { ApiResponse, SendOtpResponse, OTPVerifyResponse, LoginEmailResponse } from "@/types";
import type { OtpSendForm, EmailOtpSendForm, OtpVerifyForm, EmailLoginForm, LoginSuccessData } from "./auth-schemas";

// ==================== Result Types ====================

export interface OtpSendResult {
  success: boolean;
  devOtp?: string;
  mobileNotFoundError?: string;
  mobileAlreadyRegistered?: string;
}

export interface OtpVerifyResult {
  success: boolean;
  data?: LoginSuccessData;
  mobileNotFoundError?: string;
}

export interface EmailLoginResult {
  success: boolean;
  data?: LoginSuccessData;
}

// ==================== Handlers ====================

export function useLoginHandlers() {
  const { t } = useTranslation();

  async function sendOtp(data: OtpSendForm): Promise<OtpSendResult> {
    try {
      const res = await apiClient.post<ApiResponse<SendOtpResponse>>(
        "/auth/send-otp",
        { mobile: data.mobile, purpose: "LOGIN" }
      );
      if (res.success) {
        toast.success(t("auth.sendOtp"), { description: t("auth.otpSentTo", { mobile: data.mobile }) });
        return { success: true, devOtp: res.data?.devOtp };
      }
      return { success: false };
    } catch (err: unknown) {
      return handleOtpError(err);
    }
  }

  async function sendEmailOtp(data: EmailOtpSendForm): Promise<OtpSendResult> {
    try {
      const res = await apiClient.post<ApiResponse<SendOtpResponse>>(
        "/auth/send-otp",
        { email: data.email, purpose: "LOGIN" }
      );
      if (res.success) {
        toast.success(t("auth.sendCodeToEmail"), { description: data.email });
        return { success: true, devOtp: res.data?.devOtp };
      }
      return { success: false };
    } catch (err: unknown) {
      return handleOtpError(err);
    }
  }

  async function resendOtp(mobile: string): Promise<OtpSendResult> {
    try {
      const res = await apiClient.post<ApiResponse<SendOtpResponse>>(
        "/auth/send-otp",
        { mobile, purpose: "LOGIN" }
      );
      if (res.success) {
        toast.success(t("auth.otpResent"), { description: t("auth.newOtpSentTo", { mobile }) });
        return { success: true, devOtp: res.data?.devOtp };
      }
      return { success: false };
    } catch (err: unknown) {
      return handleOtpError(err);
    }
  }

  async function resendEmailOtp(email: string): Promise<OtpSendResult> {
    try {
      const res = await apiClient.post<ApiResponse<SendOtpResponse>>(
        "/auth/send-otp",
        { email, purpose: "LOGIN" }
      );
      if (res.success) {
        toast.success(t("auth.otpResent"), { description: email });
        return { success: true, devOtp: res.data?.devOtp };
      }
      return { success: false };
    } catch (err: unknown) {
      return handleOtpError(err);
    }
  }

  async function verifyOtp(data: OtpVerifyForm): Promise<OtpVerifyResult> {
    try {
      const payload: Record<string, string> = {
        otp: data.otp,
        purpose: "LOGIN",
      };
      if (data.mobile) payload.mobile = data.mobile;
      if (data.email) payload.email = data.email;

      const res = await apiClient.post<ApiResponse<OTPVerifyResponse>>(
        "/auth/verify-otp",
        payload
      );
      if (res.success && res.data) {
        toast.success(t("common.success"), { description: t("auth.welcomeBack") });
        return {
          success: true,
          data: { user: res.data.user, isNewUser: res.data.isNewUser },
        };
      }
      return { success: false };
    } catch (err: unknown) {
      if (err instanceof ApiClientError && (err.errorCode === "AUTH_MOBILE_NOT_REGISTERED" || err.errorCode === "AUTH_EMAIL_NOT_REGISTERED")) {
        toast.error(t("auth.verificationFailed"), { description: err.message, duration: 6000 });
        return { success: false, mobileNotFoundError: err.message };
      }
      const message = err instanceof ApiClientError ? err.message : t("common.somethingWrong");
      toast.error(t("auth.verificationFailed"), { description: message });
      return { success: false };
    }
  }

  async function emailLogin(data: EmailLoginForm): Promise<EmailLoginResult> {
    try {
      const res = await apiClient.post<ApiResponse<LoginEmailResponse>>(
        "/auth/login-email",
        { email: data.email, password: data.password }
      );
      if (res.success && res.data) {
        toast.success(t("common.success"), { description: t("auth.welcomeBack") });
        return { success: true, data: { user: res.data.user } };
      }
      return { success: false };
    } catch (err: unknown) {
      const message = err instanceof ApiClientError ? err.message : t("common.somethingWrong");
      toast.error(t("auth.loginFailed"), { description: message });
      return { success: false };
    }
  }

  // ==================== Internal ====================

  function handleOtpError(err: unknown): OtpSendResult {
    if (err instanceof ApiClientError) {
      if (err.errorCode === "AUTH_MOBILE_NOT_REGISTERED") {
        toast.error(t("auth.mobileNotRegistered"), { description: err.message, duration: 6000 });
        return { success: false, mobileNotFoundError: err.message };
      }
      if (err.errorCode === "AUTH_EMAIL_NOT_REGISTERED") {
        toast.error(t("auth.emailNotRegistered"), { description: err.message, duration: 6000 });
        return { success: false, mobileNotFoundError: err.message };
      }
      toast.error(t("common.error"), { description: err.message });
      return { success: false };
    }
    toast.error(t("common.error"), { description: t("common.somethingWrong") });
    return { success: false };
  }

  return { sendOtp, sendEmailOtp, resendOtp, resendEmailOtp, verifyOtp, emailLogin };
}
