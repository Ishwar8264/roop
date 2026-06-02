/**
 * Purpose: Premium registration form with salon-grade design
 * Responsibility: Handle new user registration via mobile + OTP
 * Design: Glassmorphism card, gradient buttons, step indicators, premium feel
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowRight, Loader2, Phone, Timer, CheckCircle2, Sparkles, User } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiClient, ApiClientError } from "@/services/api-client";
import { useTranslation } from "@/i18n/use-translation";
import type { ApiResponse, SendOtpResponse, OTPVerifyResponse, UserProfile } from "@/types";

// ==================== Zod Schemas ====================

const detailsSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name too long").trim(),
  mobile: z
    .string()
    .min(1, "Mobile number is required")
    .regex(/^[6-9]\d{9}$/, "Must be 10 digits starting with 6-9"),
});

const otpSchema = z.object({
  mobile: z.string(),
  otp: z
    .string()
    .min(1, "OTP is required")
    .regex(/^\d{6}$/, "OTP must be exactly 6 digits"),
});

type DetailsForm = z.infer<typeof detailsSchema>;
type OtpForm = z.infer<typeof otpSchema>;

// ==================== Types ====================

interface RegisterSuccessData {
  user: UserProfile;
  token: string;
}

interface RegisterFormProps {
  onSuccess?: (data: RegisterSuccessData) => void;
  onSwitchToLogin?: () => void;
  prefilledMobile?: string;
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

export function RegisterForm({ onSuccess, onSwitchToLogin, prefilledMobile }: RegisterFormProps) {
  const { t } = useTranslation();
  const [step, setStep] = useState<"details" | "otp">("details");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [devOtp, setDevOtp] = useState<string | null>(null);
  const otpTimer = useOtpTimer(30);
  const [otpDigits, setOtpDigits] = useState<string[]>(["", "", "", "", "", ""]);

  // ===== Details Form (Step 1) =====
  const detailsForm = useForm<DetailsForm>({
    resolver: zodResolver(detailsSchema),
    defaultValues: { name: "", mobile: prefilledMobile || "" },
    mode: "onChange",
  });

  // ===== OTP Form (Step 2) =====
  const otpForm = useForm<OtpForm>({
    resolver: zodResolver(otpSchema),
    defaultValues: { mobile: "", otp: "" },
    mode: "onChange",
  });

  // ===== Handlers =====

  async function handleSendOtp(data: DetailsForm) {
    setIsSubmitting(true);
    try {
      const res = await apiClient.post<ApiResponse<SendOtpResponse>>(
        "/auth/send-otp",
        { mobile: data.mobile, purpose: "REGISTER" }
      );
      if (res.success) {
        setStep("otp");
        otpForm.setValue("mobile", data.mobile);
        otpTimer.start();
        if (res.data?.devOtp) setDevOtp(res.data.devOtp);
        toast.success(t("auth.sendOtp"), { description: `OTP sent to ${data.mobile}` });
      }
    } catch (err: unknown) {
      if (err instanceof ApiClientError) {
        if (err.errorCode === "AUTH_MOBILE_EXISTS") {
          toast.error(t("auth.mobileAlreadyRegistered"), { description: err.message, duration: 6000 });
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
    const mobile = otpForm.getValues("mobile");
    if (!mobile || !otpTimer.canResend) return;
    setIsSubmitting(true);
    try {
      const res = await apiClient.post<ApiResponse<SendOtpResponse>>(
        "/auth/send-otp",
        { mobile, purpose: "REGISTER" }
      );
      if (res.success) {
        otpTimer.start();
        if (res.data?.devOtp) setDevOtp(res.data.devOtp);
        toast.success("OTP Resent", { description: `New OTP sent to ${mobile}` });
      }
    } catch (err: unknown) {
      const message = err instanceof ApiClientError ? err.message : t("common.somethingWrong");
      toast.error(t("common.error"), { description: message });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleVerifyOtp(data: OtpForm) {
    setIsSubmitting(true);
    try {
      const name = detailsForm.getValues("name");
      const res = await apiClient.post<ApiResponse<OTPVerifyResponse>>(
        "/auth/verify-otp",
        { mobile: data.mobile, otp: data.otp, purpose: "REGISTER", name }
      );
      if (res.success && res.data) {
        toast.success(t("auth.registerSuccess"), { description: "Welcome to Nikharta Roop!" });
        onSuccess?.({ user: res.data.user, token: res.data.tokens.accessToken });
      }
    } catch (err: unknown) {
      const message = err instanceof ApiClientError ? err.message : t("common.somethingWrong");
      toast.error("Registration Failed", { description: message });
    } finally {
      setIsSubmitting(false);
    }
  }

  const watchedMobile = detailsForm.watch("mobile");
  const nameValue = detailsForm.watch("name");

  // ===== OTP Box Handlers =====
  function handleOtpBoxChange(index: number, value: string, e: React.ChangeEvent<HTMLInputElement>) {
    if (!/^\d*$/.test(value)) return;
    const newDigits = [...otpDigits];
    newDigits[index] = value.slice(-1);
    setOtpDigits(newDigits);
    otpForm.setValue("otp", newDigits.join(""), { shouldValidate: true });
    if (value && index < 5) {
      const nextBox = e.currentTarget.parentElement?.querySelectorAll<HTMLInputElement>("input")[index + 1];
      nextBox?.focus();
    }
  }

  function handleOtpBoxKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !otpDigits[index] && index > 0) {
      const prevBox = (e.currentTarget.parentElement?.querySelectorAll<HTMLInputElement>("input") || [])[index - 1];
      prevBox?.focus();
    }
  }

  // ===== Render =====

  return (
    <div className="w-full">
      {/* Glassmorphism Card */}
      <div className="relative backdrop-blur-xl bg-white/70 dark:bg-card/70 rounded-3xl shadow-2xl shadow-rose-500/10 border border-white/50 dark:border-border/50 p-8 overflow-hidden">
        {/* Decorative corners */}
        <div className="absolute -top-1 -right-1 w-20 h-20 bg-gradient-to-bl from-primary/20 to-transparent rounded-bl-3xl" />
        <div className="absolute -bottom-1 -left-1 w-16 h-16 bg-gradient-to-tr from-primary/10 to-transparent rounded-tr-3xl" />

        {/* Header */}
        <div className="relative text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-rose-500 to-pink-500 shadow-lg shadow-rose-500/30 mb-4">
            <User className="h-7 w-7 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-foreground tracking-tight">
            {t("auth.registerTitle")}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {t("auth.registerSubtitle")}
          </p>
        </div>

        {/* Step Indicator — Connected Dots */}
        <div className="flex items-center justify-center gap-0 mb-6">
          <div className="flex items-center gap-2">
            <div className={`flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold transition-all duration-300 ${
              step === "details"
                ? "bg-gradient-to-br from-rose-500 to-pink-500 text-white shadow-md shadow-rose-500/30"
                : "bg-green-500 text-white shadow-md shadow-green-500/20"
            }`}>
              {step === "otp" ? <CheckCircle2 className="h-4 w-4" /> : "1"}
            </div>
            <span className={`text-xs font-medium ${step === "details" ? "text-primary" : "text-green-600 dark:text-green-400"}`}>
              {t("auth.yourDetails")}
            </span>
          </div>
          <div className={`w-10 h-0.5 mx-2 rounded-full transition-colors duration-300 ${
            step === "otp" ? "bg-green-400" : "bg-muted"
          }`} />
          <div className="flex items-center gap-2">
            <div className={`flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold transition-all duration-300 ${
              step === "otp"
                ? "bg-gradient-to-br from-rose-500 to-pink-500 text-white shadow-md shadow-rose-500/30"
                : "bg-muted text-muted-foreground"
            }`}>
              2
            </div>
            <span className={`text-xs font-medium ${step === "otp" ? "text-primary" : "text-muted-foreground"}`}>
              {t("auth.verifyOtp")}
            </span>
          </div>
        </div>

        {/* Dev OTP Banner */}
        {devOtp && step === "otp" && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-center mb-4 dark:bg-amber-900/20 dark:border-amber-800">
            <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
              {t("auth.devOtp")}: <span className="font-bold text-lg tracking-wider">{devOtp}</span>
            </p>
          </div>
        )}

        {/* ===== Step 1: Details ===== */}
        {step === "details" && (
          <form onSubmit={detailsForm.handleSubmit(handleSendOtp)} className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block text-foreground">{t("auth.name")} *</label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder={t("auth.enterName")}
                  {...detailsForm.register("name")}
                  className={`h-12 pl-11 rounded-xl border-muted/50 bg-white/50 dark:bg-background/50 focus-visible:ring-rose-500/30 focus-visible:border-primary/50 transition-all ${
                    detailsForm.formState.errors.name ? "border-destructive focus-visible:ring-destructive/30" : ""
                  }`}
                />
              </div>
              {detailsForm.formState.errors.name && (
                <p className="text-xs text-destructive mt-1.5 ml-1">{detailsForm.formState.errors.name.message}</p>
              )}
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block text-foreground">{t("auth.mobileNumber")} *</label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-muted-foreground" />
                <Input
                  type="tel"
                  placeholder={t("auth.enterMobile")}
                  {...detailsForm.register("mobile")}
                  className={`h-12 pl-11 rounded-xl border-muted/50 bg-white/50 dark:bg-background/50 focus-visible:ring-rose-500/30 focus-visible:border-primary/50 transition-all ${
                    detailsForm.formState.errors.mobile ? "border-destructive focus-visible:ring-destructive/30" : ""
                  }`}
                />
              </div>
              {detailsForm.formState.errors.mobile && (
                <p className="text-xs text-destructive mt-1.5 ml-1">{detailsForm.formState.errors.mobile.message}</p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full h-12 rounded-xl bg-gradient-to-r from-rose-600 to-pink-500 hover:from-rose-700 hover:to-pink-600 text-white font-semibold shadow-lg shadow-rose-500/25 hover:shadow-rose-500/40 transition-all duration-300 disabled:opacity-50"
              disabled={isSubmitting || !detailsForm.formState.isValid}
            >
              {isSubmitting ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  <Phone className="mr-2 h-4 w-4" />
                  {t("auth.sendOtp")}
                </>
              )}
            </Button>
          </form>
        )}

        {/* ===== Step 2: OTP Verification ===== */}
        {step === "otp" && (
          <form onSubmit={otpForm.handleSubmit(handleVerifyOtp)} className="space-y-4">
            {/* Summary of details */}
            <div className="bg-gradient-to-r from-rose-50 to-pink-50 dark:from-rose-950/20 dark:to-pink-950/20 rounded-xl p-4 space-y-2 border border-rose-100 dark:border-rose-900/30">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t("auth.name")}:</span>
                <span className="font-semibold text-foreground">{nameValue}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t("auth.mobileNumber")}:</span>
                <span className="font-semibold text-foreground">{watchedMobile}</span>
              </div>
              <button
                type="button"
                className="text-xs text-primary font-medium hover:underline"
                onClick={() => { setStep("details"); setDevOtp(null); otpForm.reset(); setOtpDigits(["", "", "", "", "", ""]); }}
              >
                {t("auth.changeDetails")}
              </button>
            </div>

            {/* OTP Digit Boxes */}
            <div>
              <label className="text-sm font-medium mb-2 block text-foreground">OTP</label>
              <div className="flex gap-2 justify-center">
                {otpDigits.map((digit, i) => (
                  <input
                    key={i}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpBoxChange(i, e.target.value, e)}
                    onKeyDown={(e) => handleOtpBoxKeyDown(i, e)}
                    className={`w-11 h-13 text-center text-lg font-bold rounded-xl border-2 bg-white/50 dark:bg-background/50 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-rose-500/30 focus:border-primary/50 focus:scale-105 ${
                      digit ? "border-primary/50 text-primary" : "border-muted/50 text-foreground"
                    }`}
                  />
                ))}
              </div>
              {otpForm.formState.errors.otp && (
                <p className="text-xs text-destructive mt-1.5 text-center">{otpForm.formState.errors.otp.message}</p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full h-12 rounded-xl bg-gradient-to-r from-rose-600 to-pink-500 hover:from-rose-700 hover:to-pink-600 text-white font-semibold shadow-lg shadow-rose-500/25 hover:shadow-rose-500/40 transition-all duration-300 disabled:opacity-50"
              disabled={isSubmitting || !otpForm.formState.isValid}
            >
              {isSubmitting ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  {t("auth.verifyAndRegister")}
                </>
              )}
            </Button>

            {/* Resend OTP with Timer */}
            <div className="text-center pt-1">
              {otpTimer.isRunning ? (
                <p className="text-sm text-muted-foreground flex items-center justify-center gap-1.5">
                  <Timer className="h-3.5 w-3.5 animate-pulse" />
                  Resend in <span className="font-semibold text-foreground tabular-nums">{otpTimer.secondsLeft}s</span>
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

        {/* Divider */}
        <div className="flex items-center gap-3 mt-6">
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-muted to-transparent" />
        </div>

        {/* Switch to Login */}
        <div className="text-center mt-5">
          <p className="text-sm text-muted-foreground">
            {t("auth.hasAccount")}{" "}
            <button
              type="button"
              className="text-primary font-semibold hover:underline underline-offset-2"
              onClick={onSwitchToLogin}
            >
              {t("auth.login")}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
