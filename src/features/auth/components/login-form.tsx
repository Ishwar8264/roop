/**
 * Purpose: Login form with OTP (mobile) and Email+Password tabs
 * Responsibility: Handle user login via OTP or email/password
 * Important Notes:
 *   - react-hook-form + Zod for real-time validation
 *   - OTP countdown timer (30s cooldown before resend)
 *   - Toast notifications on success/error (sonner)
 *   - Field-level validation with error messages
 *   - Backend error messages shown via toast
 *   - AUTH_MOBILE_NOT_REGISTERED → shows "Register First" link
 *   - i18n for all UI strings
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Phone, Mail, ArrowRight, Loader2, Timer, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { apiClient, ApiClientError } from "@/services/api-client";
import { useTranslation } from "@/i18n/use-translation";
import type { ApiResponse, SendOtpResponse, OTPVerifyResponse, LoginEmailResponse, UserProfile } from "@/types";

// ==================== Zod Schemas ====================

const otpSendSchema = z.object({
  mobile: z
    .string()
    .min(1, "Mobile number is required")
    .regex(/^[6-9]\d{9}$/, "Must be 10 digits starting with 6-9"),
});

const otpVerifySchema = z.object({
  mobile: z.string(),
  otp: z
    .string()
    .min(1, "OTP is required")
    .regex(/^\d{6}$/, "OTP must be exactly 6 digits"),
});

const emailLoginSchema = z.object({
  email: z.string().min(1, "Email is required").email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

type OtpSendForm = z.infer<typeof otpSendSchema>;
type OtpVerifyForm = z.infer<typeof otpVerifySchema>;
type EmailLoginForm = z.infer<typeof emailLoginSchema>;

// ==================== Types ====================

interface LoginSuccessData {
  user: UserProfile;
  token: string;
  isNewUser?: boolean;
}

interface LoginFormProps {
  onSuccess?: (data: LoginSuccessData) => void;
  onSwitchToRegister?: (mobile?: string) => void;
}

// ==================== OTP Timer Hook ====================

function useOtpTimer(initialSeconds: number = 30) {
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [isRunning, setIsRunning] = useState(false);

  const start = useCallback(() => {
    setSecondsLeft(initialSeconds);
    setIsRunning(true);
  }, [initialSeconds]);

  useEffect(() => {
    if (!isRunning || secondsLeft <= 0) {
      setIsRunning(false);
      return;
    }
    const interval = setInterval(() => {
      setSecondsLeft((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isRunning, secondsLeft]);

  return { secondsLeft, isRunning, start, canResend: !isRunning && secondsLeft === 0 };
}

// ==================== Component ====================

export function LoginForm({ onSuccess, onSwitchToRegister }: LoginFormProps) {
  const { t } = useTranslation();
  const [tab, setTab] = useState<"otp" | "email">("otp");
  const [otpSent, setOtpSent] = useState(false);
  const [devOtp, setDevOtp] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mobileNotFoundError, setMobileNotFoundError] = useState<string | null>(null);
  const otpTimer = useOtpTimer(30);

  // ===== OTP Send Form =====
  const otpSendForm = useForm<OtpSendForm>({
    resolver: zodResolver(otpSendSchema),
    defaultValues: { mobile: "" },
    mode: "onChange",
  });

  // ===== OTP Verify Form =====
  const otpVerifyForm = useForm<OtpVerifyForm>({
    resolver: zodResolver(otpVerifySchema),
    defaultValues: { mobile: "", otp: "" },
    mode: "onChange",
  });

  // ===== Email Login Form =====
  const emailForm = useForm<EmailLoginForm>({
    resolver: zodResolver(emailLoginSchema),
    defaultValues: { email: "", password: "" },
    mode: "onChange",
  });

  // When mobile is set from send form, copy to verify form
  const watchedMobile = otpSendForm.watch("mobile");

  // Clear mobile not found error when user types
  useEffect(() => {
    setMobileNotFoundError(null);
  }, [watchedMobile]);

  // ===== Handlers =====

  async function handleSendOtp(data: OtpSendForm) {
    setIsSubmitting(true);
    setMobileNotFoundError(null);
    try {
      const res = await apiClient.post<ApiResponse<SendOtpResponse>>(
        "/auth/send-otp",
        { mobile: data.mobile, purpose: "LOGIN" }
      );

      if (res.success) {
        setOtpSent(true);
        otpVerifyForm.setValue("mobile", data.mobile);
        otpTimer.start();
        if (res.data?.devOtp) {
          setDevOtp(res.data.devOtp);
        }
        toast.success(t("auth.sendOtp"), {
          description: `OTP sent to ${data.mobile}`,
        });
      }
    } catch (err: unknown) {
      if (err instanceof ApiClientError) {
        // Special handling: mobile not registered → show register prompt
        if (err.errorCode === "AUTH_MOBILE_NOT_REGISTERED") {
          setMobileNotFoundError(err.message);
          toast.error(t("auth.mobileNotRegistered"), {
            description: err.message,
            duration: 6000,
          });
        } else {
          toast.error(t("common.error"), { description: err.message });
        }
      } else {
        toast.error(t("common.error"), { description: t("common.somethingWrong") });
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleResendOtp() {
    const mobile = otpVerifyForm.getValues("mobile");
    if (!mobile || !otpTimer.canResend) return;

    setIsSubmitting(true);
    try {
      const res = await apiClient.post<ApiResponse<SendOtpResponse>>(
        "/auth/send-otp",
        { mobile, purpose: "LOGIN" }
      );

      if (res.success) {
        otpTimer.start();
        if (res.data?.devOtp) {
          setDevOtp(res.data.devOtp);
        }
        toast.success("OTP Resent", {
          description: `New OTP sent to ${mobile}`,
        });
      }
    } catch (err: unknown) {
      const message = err instanceof ApiClientError ? err.message : t("common.somethingWrong");
      toast.error(t("common.error"), { description: message });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleVerifyOtp(data: OtpVerifyForm) {
    setIsSubmitting(true);
    try {
      const res = await apiClient.post<ApiResponse<OTPVerifyResponse>>(
        "/auth/verify-otp",
        { mobile: data.mobile, otp: data.otp, purpose: "LOGIN" }
      );

      if (res.success && res.data) {
        toast.success(t("common.success"), {
          description: "Welcome back!",
        });
        onSuccess?.({
          user: res.data.user,
          token: res.data.tokens.accessToken,
          isNewUser: res.data.isNewUser,
        });
      }
    } catch (err: unknown) {
      if (err instanceof ApiClientError) {
        if (err.errorCode === "AUTH_MOBILE_NOT_REGISTERED") {
          setMobileNotFoundError(err.message);
          toast.error(t("auth.mobileNotRegistered"), {
            description: err.message,
            duration: 6000,
          });
        } else {
          toast.error("Verification Failed", { description: err.message });
        }
      } else {
        toast.error("Verification Failed", { description: t("common.somethingWrong") });
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleEmailLogin(data: EmailLoginForm) {
    setIsSubmitting(true);
    try {
      const res = await apiClient.post<ApiResponse<LoginEmailResponse>>(
        "/auth/login-email",
        { email: data.email, password: data.password }
      );

      if (res.success && res.data) {
        toast.success(t("common.success"), {
          description: "Welcome back!",
        });
        onSuccess?.({
          user: res.data.user,
          token: res.data.tokens.accessToken,
        });
      }
    } catch (err: unknown) {
      const message = err instanceof ApiClientError ? err.message : t("common.somethingWrong");
      toast.error(t("auth.loginTitle") + " Failed", { description: message });
    } finally {
      setIsSubmitting(false);
    }
  }

  // ===== Render =====

  return (
    <Card className="w-full max-w-md mx-auto shadow-lg border-border/50">
      <CardHeader className="text-center pb-2">
        <CardTitle className="text-2xl font-bold">
          {t("auth.loginTitle")}
        </CardTitle>
        <CardDescription>
          {t("auth.loginSubtitle")}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Dev OTP Banner */}
        {devOtp && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-center dark:bg-yellow-900/20 dark:border-yellow-800">
            <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
              {t("auth.devOtp")}: <span className="font-bold">{devOtp}</span>
            </p>
          </div>
        )}

        {/* Mobile Not Registered — Inline Error Banner */}
        {mobileNotFoundError && (
          <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-3 flex items-start gap-2.5">
            <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-destructive">
                {t("auth.mobileNotRegistered")}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {mobileNotFoundError}
              </p>
              <button
                type="button"
                className="text-xs text-primary font-medium hover:underline mt-1"
                onClick={() => onSwitchToRegister?.(watchedMobile)}
              >
                {t("auth.registerFirst")} →
              </button>
            </div>
          </div>
        )}

        {/* Tab Switcher */}
        <div className="flex rounded-lg border overflow-hidden">
          <button
            type="button"
            onClick={() => { setTab("otp"); setOtpSent(false); setDevOtp(null); setMobileNotFoundError(null); }}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium transition-colors ${
              tab === "otp"
                ? "bg-primary text-primary-foreground"
                : "bg-muted/50 text-muted-foreground hover:bg-muted"
            }`}
          >
            <Phone className="h-4 w-4" />
            {t("auth.mobileOtp")}
          </button>
          <button
            type="button"
            onClick={() => setTab("email")}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium transition-colors ${
              tab === "email"
                ? "bg-primary text-primary-foreground"
                : "bg-muted/50 text-muted-foreground hover:bg-muted"
            }`}
          >
            <Mail className="h-4 w-4" />
            {t("auth.email")}
          </button>
        </div>

        {/* ===== OTP Tab ===== */}
        {tab === "otp" && !otpSent && (
          <form onSubmit={otpSendForm.handleSubmit(handleSendOtp)} className="space-y-3">
            <div>
              <label className="text-sm font-medium mb-1.5 block">{t("auth.mobileNumber")}</label>
              <Input
                type="tel"
                placeholder={t("auth.enterMobile")}
                {...otpSendForm.register("mobile")}
                className={`h-11 ${otpSendForm.formState.errors.mobile ? "border-destructive focus-visible:ring-destructive" : ""}`}
              />
              {otpSendForm.formState.errors.mobile && (
                <p className="text-xs text-destructive mt-1">
                  {otpSendForm.formState.errors.mobile.message}
                </p>
              )}
            </div>
            <Button
              type="submit"
              className="w-full h-11"
              disabled={isSubmitting || !otpSendForm.formState.isValid}
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <ArrowRight className="h-4 w-4 mr-2" />
              )}
              {t("auth.sendOtp")}
            </Button>
          </form>
        )}

        {tab === "otp" && otpSent && (
          <form onSubmit={otpVerifyForm.handleSubmit(handleVerifyOtp)} className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                OTP sent to <span className="font-medium text-foreground">{watchedMobile}</span>
              </span>
              <button
                type="button"
                className="text-primary text-xs hover:underline"
                onClick={() => { setOtpSent(false); setDevOtp(null); otpSendForm.reset(); }}
              >
                {t("auth.changeNumber")}
              </button>
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">OTP</label>
              <Input
                type="text"
                placeholder={t("auth.enterOtp")}
                {...otpVerifyForm.register("otp")}
                maxLength={6}
                className={`h-11 text-center text-lg tracking-widest ${otpVerifyForm.formState.errors.otp ? "border-destructive focus-visible:ring-destructive" : ""}`}
                autoFocus
              />
              {otpVerifyForm.formState.errors.otp && (
                <p className="text-xs text-destructive mt-1">
                  {otpVerifyForm.formState.errors.otp.message}
                </p>
              )}
            </div>
            <Button
              type="submit"
              className="w-full h-11"
              disabled={isSubmitting || !otpVerifyForm.formState.isValid}
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              {t("auth.verifyOtp")}
            </Button>

            {/* Resend OTP with Timer */}
            <div className="text-center">
              {otpTimer.isRunning ? (
                <p className="text-sm text-muted-foreground flex items-center justify-center gap-1.5">
                  <Timer className="h-3.5 w-3.5" />
                  Resend in <span className="font-medium text-foreground">{otpTimer.secondsLeft}s</span>
                </p>
              ) : (
                <button
                  type="button"
                  className="text-sm text-primary font-medium hover:underline"
                  onClick={handleResendOtp}
                  disabled={isSubmitting}
                >
                  Resend OTP
                </button>
              )}
            </div>
          </form>
        )}

        {/* ===== Email Tab ===== */}
        {tab === "email" && (
          <form onSubmit={emailForm.handleSubmit(handleEmailLogin)} className="space-y-3">
            <div>
              <label className="text-sm font-medium mb-1.5 block">{t("auth.email")}</label>
              <Input
                type="email"
                placeholder="example@email.com"
                {...emailForm.register("email")}
                className={`h-11 ${emailForm.formState.errors.email ? "border-destructive focus-visible:ring-destructive" : ""}`}
              />
              {emailForm.formState.errors.email && (
                <p className="text-xs text-destructive mt-1">
                  {emailForm.formState.errors.email.message}
                </p>
              )}
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">{t("auth.password")}</label>
              <Input
                type="password"
                placeholder={t("auth.enterPassword")}
                {...emailForm.register("password")}
                className={`h-11 ${emailForm.formState.errors.password ? "border-destructive focus-visible:ring-destructive" : ""}`}
              />
              {emailForm.formState.errors.password && (
                <p className="text-xs text-destructive mt-1">
                  {emailForm.formState.errors.password.message}
                </p>
              )}
            </div>
            <Button
              type="submit"
              className="w-full h-11"
              disabled={isSubmitting || !emailForm.formState.isValid}
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <ArrowRight className="h-4 w-4 mr-2" />
              )}
              {t("auth.loginButton")}
            </Button>
          </form>
        )}

        {/* Switch to Register */}
        <div className="text-center pt-2 border-t">
          <p className="text-sm text-muted-foreground">
            {t("auth.noAccount")}{" "}
            <button
              type="button"
              className="text-primary font-medium hover:underline"
              onClick={() => onSwitchToRegister?.()}
            >
              {t("auth.register")}
            </button>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
