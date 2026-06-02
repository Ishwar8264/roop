/**
 * Purpose: Premium login form with salon-grade design
 * Responsibility: Handle user login via OTP or email/password
 * Design: Glassmorphism card, floating labels, gradient buttons, premium feel
 */

"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Phone, Mail, ArrowRight, Loader2, Timer, AlertCircle, Sparkles, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { apiClient, ApiClientError } from "@/services/api-client";
import { useTranslation } from "@/i18n/use-translation";
import { useOtpTimer } from "@/features/auth/hooks/use-otp-timer";
import { FloatingLabelInput } from "./floating-label-input";
import { OtpInput } from "./otp-input";
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

// ==================== Component ====================

export function LoginForm({ onSuccess, onSwitchToRegister }: LoginFormProps) {
  const { t } = useTranslation();
  const [tab, setTab] = useState<"otp" | "email">("otp");
  const [otpSent, setOtpSent] = useState(false);
  const [devOtp, setDevOtp] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mobileNotFoundError, setMobileNotFoundError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
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

  const watchedMobile = otpSendForm.watch("mobile");

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
        if (res.data?.devOtp) setDevOtp(res.data.devOtp);
        toast.success(t("auth.sendOtp"), { description: t("auth.otpSentTo", { mobile: data.mobile }) });
      }
    } catch (err: unknown) {
      if (err instanceof ApiClientError) {
        if (err.errorCode === "AUTH_MOBILE_NOT_REGISTERED") {
          setMobileNotFoundError(err.message);
          toast.error(t("auth.mobileNotRegistered"), { description: err.message, duration: 6000 });
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
        if (res.data?.devOtp) setDevOtp(res.data.devOtp);
        toast.success(t("auth.otpResent"), { description: t("auth.newOtpSentTo", { mobile }) });
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
        toast.success(t("common.success"), { description: t("auth.welcomeBack") });
        onSuccess?.({ user: res.data.user, token: res.data.tokens.accessToken, isNewUser: res.data.isNewUser });
      }
    } catch (err: unknown) {
      if (err instanceof ApiClientError) {
        if (err.errorCode === "AUTH_MOBILE_NOT_REGISTERED") {
          setMobileNotFoundError(err.message);
          toast.error(t("auth.mobileNotRegistered"), { description: err.message, duration: 6000 });
        } else {
          toast.error(t("auth.verificationFailed"), { description: err.message });
        }
      } else {
        toast.error(t("auth.verificationFailed"), { description: t("common.somethingWrong") });
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
        toast.success(t("common.success"), { description: t("auth.welcomeBack") });
        onSuccess?.({ user: res.data.user, token: res.data.tokens.accessToken });
      }
    } catch (err: unknown) {
      const message = err instanceof ApiClientError ? err.message : t("common.somethingWrong");
      toast.error(t("auth.loginFailed"), { description: message });
    } finally {
      setIsSubmitting(false);
    }
  }

  // ===== Render =====

  return (
    <div className="w-full">
      {/* Glassmorphism Card */}
      <div className="relative backdrop-blur-xl bg-white/70 dark:bg-card/70 rounded-3xl shadow-2xl shadow-rose-500/10 border border-white/50 dark:border-border/50 p-8 overflow-hidden">
        {/* Decorative corner sparkle */}
        <div className="absolute -top-1 -right-1 w-20 h-20 bg-gradient-to-bl from-primary/20 to-transparent rounded-bl-3xl" />
        <div className="absolute -bottom-1 -left-1 w-16 h-16 bg-gradient-to-tr from-primary/10 to-transparent rounded-tr-3xl" />

        {/* Header */}
        <div className="relative text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-rose-500 to-pink-500 shadow-lg shadow-rose-500/30 mb-4">
            <Sparkles className="h-7 w-7 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-foreground tracking-tight">
            {t("auth.loginTitle")}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {t("auth.loginSubtitle")}
          </p>
        </div>

        {/* Dev OTP Banner */}
        {devOtp && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-center mb-4 dark:bg-amber-900/20 dark:border-amber-800">
            <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
              {t("auth.devOtp")}: <span className="font-bold text-lg tracking-wider">{devOtp}</span>
            </p>
          </div>
        )}

        {/* Mobile Not Registered Banner */}
        {mobileNotFoundError && (
          <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-3 flex items-start gap-2.5 mb-4">
            <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-destructive">{t("auth.mobileNotRegistered")}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{mobileNotFoundError}</p>
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

        {/* Tab Switcher — Pill Style */}
        <div className="relative flex bg-muted/50 rounded-xl p-1 mb-6">
          <div
            className={`absolute top-1 bottom-1 rounded-lg bg-gradient-to-r from-rose-500 to-pink-500 shadow-md shadow-rose-500/25 transition-all duration-300 ease-out ${
              tab === "otp" ? "left-1 w-[calc(50%-4px)]" : "left-[calc(50%+2px)] w-[calc(50%-4px)]"
            }`}
          />
          <button
            type="button"
            onClick={() => { setTab("otp"); setOtpSent(false); setDevOtp(null); setMobileNotFoundError(null); }}
            className={`relative z-10 flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium transition-colors duration-300 ${
              tab === "otp" ? "text-white" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Phone className="h-4 w-4" />
            {t("auth.mobileOtp")}
          </button>
          <button
            type="button"
            onClick={() => setTab("email")}
            className={`relative z-10 flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium transition-colors duration-300 ${
              tab === "email" ? "text-white" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Mail className="h-4 w-4" />
            {t("auth.email")}
          </button>
        </div>

        {/* ===== OTP Tab ===== */}
        {tab === "otp" && !otpSent && (
          <form onSubmit={otpSendForm.handleSubmit(handleSendOtp)} className="space-y-5">
            <FloatingLabelInput
              label={t("auth.mobileNumber")}
              type="tel"
              icon={<Phone className="h-4.5 w-4.5" />}
              error={otpSendForm.formState.errors.mobile?.message}
              registerProps={otpSendForm.register("mobile")}
            />
            <Button
              type="submit"
              className="w-full h-12 rounded-xl bg-gradient-to-r from-rose-600 to-pink-500 hover:from-rose-700 hover:to-pink-600 text-white font-semibold shadow-lg shadow-rose-500/25 hover:shadow-rose-500/40 transition-all duration-300 disabled:opacity-50"
              disabled={isSubmitting || !otpSendForm.formState.isValid}
            >
              {isSubmitting ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  {t("auth.sendOtp")}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </form>
        )}

        {tab === "otp" && otpSent && (
          <form onSubmit={otpVerifyForm.handleSubmit(handleVerifyOtp)} className="space-y-5">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {t("auth.otpSentTo")} <span className="font-semibold text-foreground">{watchedMobile}</span>
              </span>
              <button
                type="button"
                className="text-primary text-xs font-medium hover:underline"
                onClick={() => { setOtpSent(false); setDevOtp(null); otpSendForm.reset(); otpVerifyForm.setValue("otp", ""); }}
              >
                {t("auth.changeNumber")}
              </button>
            </div>

            {/* OTP Digit Boxes */}
            <OtpInput
              value={otpVerifyForm.watch("otp") || ""}
              onChange={(val) => otpVerifyForm.setValue("otp", val, { shouldValidate: true })}
              error={otpVerifyForm.formState.errors.otp?.message}
              disabled={isSubmitting}
            />

            <Button
              type="submit"
              className="w-full h-12 rounded-xl bg-gradient-to-r from-rose-600 to-pink-500 hover:from-rose-700 hover:to-pink-600 text-white font-semibold shadow-lg shadow-rose-500/25 hover:shadow-rose-500/40 transition-all duration-300 disabled:opacity-50"
              disabled={isSubmitting || !otpVerifyForm.formState.isValid}
            >
              {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : t("auth.verifyOtp")}
            </Button>

            {/* Resend OTP with Timer */}
            <div className="text-center pt-1">
              {otpTimer.isRunning ? (
                <p className="text-sm text-muted-foreground flex items-center justify-center gap-1.5">
                  <Timer className="h-3.5 w-3.5 animate-pulse" />
                  {t("auth.resendIn")} <span className="font-semibold text-foreground tabular-nums">{otpTimer.secondsLeft}s</span>
                </p>
              ) : (
                <button
                  type="button"
                  className="text-sm text-primary font-medium hover:underline"
                  onClick={handleResendOtp}
                  disabled={isSubmitting}
                >
                  {t("auth.resendOtp")}
                </button>
              )}
            </div>
          </form>
        )}

        {/* ===== Email Tab ===== */}
        {tab === "email" && (
          <form onSubmit={emailForm.handleSubmit(handleEmailLogin)} className="space-y-5">
            <FloatingLabelInput
              label={t("auth.email")}
              type="email"
              icon={<Mail className="h-4.5 w-4.5" />}
              error={emailForm.formState.errors.email?.message}
              registerProps={emailForm.register("email")}
            />
            <FloatingLabelInput
              label={t("auth.password")}
              type={showPassword ? "text" : "password"}
              icon={<Eye className="h-4.5 w-4.5" />}
              error={emailForm.formState.errors.password?.message}
              registerProps={emailForm.register("password")}
              rightAction={
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-muted-foreground hover:text-foreground transition-colors p-1"
                  tabIndex={-1}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              }
            />
            <Button
              type="submit"
              className="w-full h-12 rounded-xl bg-gradient-to-r from-rose-600 to-pink-500 hover:from-rose-700 hover:to-pink-600 text-white font-semibold shadow-lg shadow-rose-500/25 hover:shadow-rose-500/40 transition-all duration-300 disabled:opacity-50"
              disabled={isSubmitting || !emailForm.formState.isValid}
            >
              {isSubmitting ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  {t("auth.loginButton")}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </form>
        )}

        {/* Divider */}
        <div className="flex items-center gap-3 mt-6">
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-muted to-transparent" />
          <span className="text-xs text-muted-foreground">{t("auth.orLoginWith")}</span>
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-muted to-transparent" />
        </div>

        {/* Switch to Register */}
        <div className="text-center mt-5">
          <p className="text-sm text-muted-foreground">
            {t("auth.noAccount")}{" "}
            <button
              type="button"
              className="text-primary font-semibold hover:underline underline-offset-2"
              onClick={() => onSwitchToRegister?.()}
            >
              {t("auth.register")}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
