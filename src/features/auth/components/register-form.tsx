/**
 * Purpose: Registration form with Mobile OTP verification
 * Responsibility: Handle new user registration via mobile + OTP
 * Important Notes:
 *   - Step 1: Name + Mobile → Send OTP (purpose: REGISTER)
 *   - Step 2: OTP verification → Create account + Auto login
 *   - react-hook-form + Zod for real-time validation
 *   - OTP countdown timer (30s cooldown before resend)
 *   - Toast notifications on success/error (sonner)
 *   - Field-level validation with error messages
 *   - Backend error messages shown via toast
 *   - Mobile number is REQUIRED (primary auth method)
 *   - i18n for all UI strings
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowRight, Loader2, Eye, EyeOff, Phone, Timer, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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

  // ===== Details Form (Step 1) =====
  const detailsForm = useForm<DetailsForm>({
    resolver: zodResolver(detailsSchema),
    defaultValues: {
      name: "",
      mobile: prefilledMobile || "",
    },
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
        if (res.data?.devOtp) {
          setDevOtp(res.data.devOtp);
        }
        toast.success(t("auth.sendOtp"), {
          description: `OTP sent to ${data.mobile}`,
        });
      }
    } catch (err: unknown) {
      if (err instanceof ApiClientError) {
        // Mobile already registered → redirect to login
        if (err.errorCode === "AUTH_MOBILE_EXISTS") {
          toast.error(t("auth.mobileAlreadyRegistered"), {
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

  async function handleVerifyOtp(data: OtpForm) {
    setIsSubmitting(true);
    try {
      const name = detailsForm.getValues("name");
      const res = await apiClient.post<ApiResponse<OTPVerifyResponse>>(
        "/auth/verify-otp",
        { mobile: data.mobile, otp: data.otp, purpose: "REGISTER", name }
      );

      if (res.success && res.data) {
        toast.success(t("auth.registerSuccess"), {
          description: "Welcome to Nikharta Roop!",
        });
        onSuccess?.({
          user: res.data.user,
          token: res.data.tokens.accessToken,
        });
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

  // ===== Render =====

  return (
    <Card className="w-full max-w-md mx-auto shadow-lg border-border/50">
      <CardHeader className="text-center pb-2">
        <CardTitle className="text-2xl font-bold">
          {t("auth.registerTitle")}
        </CardTitle>
        <CardDescription>
          {t("auth.registerSubtitle")}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Step indicator */}
        <div className="flex items-center gap-2 text-sm">
          <div className={`flex items-center gap-1.5 ${step === "details" ? "text-primary font-medium" : "text-muted-foreground"}`}>
            <span className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold ${
              step === "details" ? "bg-primary text-primary-foreground" : step === "otp" ? "bg-green-500 text-white" : "bg-muted text-muted-foreground"
            }`}>
              {step === "otp" ? <CheckCircle2 className="h-4 w-4" /> : "1"}
            </span>
            {t("auth.yourDetails")}
          </div>
          <div className="flex-1 h-px bg-border" />
          <div className={`flex items-center gap-1.5 ${step === "otp" ? "text-primary font-medium" : "text-muted-foreground"}`}>
            <span className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold ${
              step === "otp" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
            }`}>
              2
            </span>
            {t("auth.verifyOtp")}
          </div>
        </div>

        {/* Dev OTP Banner */}
        {devOtp && step === "otp" && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-center dark:bg-yellow-900/20 dark:border-yellow-800">
            <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
              {t("auth.devOtp")}: <span className="font-bold">{devOtp}</span>
            </p>
          </div>
        )}

        {/* ===== Step 1: Details ===== */}
        {step === "details" && (
          <form onSubmit={detailsForm.handleSubmit(handleSendOtp)} className="space-y-3">
            {/* Name */}
            <div>
              <label className="text-sm font-medium mb-1.5 block">{t("auth.name")} *</label>
              <Input
                type="text"
                placeholder={t("auth.enterName")}
                {...detailsForm.register("name")}
                className={`h-11 ${detailsForm.formState.errors.name ? "border-destructive focus-visible:ring-destructive" : ""}`}
              />
              {detailsForm.formState.errors.name && (
                <p className="text-xs text-destructive mt-1">{detailsForm.formState.errors.name.message}</p>
              )}
            </div>

            {/* Mobile */}
            <div>
              <label className="text-sm font-medium mb-1.5 block">{t("auth.mobileNumber")} *</label>
              <Input
                type="tel"
                placeholder={t("auth.enterMobile")}
                {...detailsForm.register("mobile")}
                className={`h-11 ${detailsForm.formState.errors.mobile ? "border-destructive focus-visible:ring-destructive" : ""}`}
              />
              {detailsForm.formState.errors.mobile && (
                <p className="text-xs text-destructive mt-1">{detailsForm.formState.errors.mobile.message}</p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full h-11"
              disabled={isSubmitting || !detailsForm.formState.isValid}
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Phone className="h-4 w-4 mr-2" />
              )}
              {t("auth.sendOtp")}
            </Button>
          </form>
        )}

        {/* ===== Step 2: OTP Verification ===== */}
        {step === "otp" && (
          <form onSubmit={otpForm.handleSubmit(handleVerifyOtp)} className="space-y-3">
            {/* Summary of details */}
            <div className="bg-muted/50 rounded-lg p-3 space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t("auth.name")}:</span>
                <span className="font-medium">{nameValue}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t("auth.mobileNumber")}:</span>
                <span className="font-medium">{watchedMobile}</span>
              </div>
              <button
                type="button"
                className="text-xs text-primary hover:underline"
                onClick={() => { setStep("details"); setDevOtp(null); otpForm.reset(); }}
              >
                {t("auth.changeDetails")}
              </button>
            </div>

            {/* OTP Input */}
            <div>
              <label className="text-sm font-medium mb-1.5 block">OTP</label>
              <Input
                type="text"
                placeholder={t("auth.enterOtp")}
                {...otpForm.register("otp")}
                maxLength={6}
                className={`h-11 text-center text-lg tracking-widest ${otpForm.formState.errors.otp ? "border-destructive focus-visible:ring-destructive" : ""}`}
                autoFocus
              />
              {otpForm.formState.errors.otp && (
                <p className="text-xs text-destructive mt-1">{otpForm.formState.errors.otp.message}</p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full h-11"
              disabled={isSubmitting || !otpForm.formState.isValid}
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <CheckCircle2 className="h-4 w-4 mr-2" />
              )}
              {t("auth.verifyAndRegister")}
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

        {/* Switch to Login */}
        <div className="text-center pt-2 border-t">
          <p className="text-sm text-muted-foreground">
            {t("auth.hasAccount")}{" "}
            <button
              type="button"
              className="text-primary font-medium hover:underline"
              onClick={onSwitchToLogin}
            >
              {t("auth.login")}
            </button>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
