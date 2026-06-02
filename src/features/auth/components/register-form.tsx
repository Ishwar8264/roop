/**
 * Purpose: Register form UI — renders form, delegates logic to register-handlers
 * Responsibility: UI only — no API calls, no toast logic
 * Lines: ~130
 */

"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Phone, Loader2, Timer, CheckCircle2, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/i18n/use-translation";
import { useOtpTimer } from "@/features/auth/hooks/use-otp-timer";
import { useRegisterHandlers } from "@/features/auth/logic/register-handlers";
import { registerDetailsSchema, registerOtpSchema } from "@/features/auth/logic/auth-schemas";
import type { RegisterDetailsForm, RegisterOtpForm, RegisterSuccessData } from "@/features/auth/logic/auth-schemas";
import { GlassmorphismCard } from "./ui/glassmorphism-card";
import { FloatingLabelInput } from "./ui/floating-label-input";
import { OtpInput } from "./ui/otp-input";

interface RegisterFormProps {
  onSuccess?: (data: RegisterSuccessData) => void;
  onSwitchToLogin?: () => void;
  prefilledMobile?: string;
}

export function RegisterForm({ onSuccess, onSwitchToLogin, prefilledMobile }: RegisterFormProps) {
  const { t } = useTranslation();
  const handlers = useRegisterHandlers();
  const otpTimer = useOtpTimer(30);

  const [step, setStep] = useState<"details" | "otp">("details");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [devOtp, setDevOtp] = useState<string | null>(null);

  const detailsForm = useForm<RegisterDetailsForm>({ resolver: zodResolver(registerDetailsSchema), defaultValues: { name: "", mobile: prefilledMobile || "" }, mode: "onChange" });
  const otpForm = useForm<RegisterOtpForm>({ resolver: zodResolver(registerOtpSchema), defaultValues: { mobile: "", otp: "" }, mode: "onChange" });

  const watchedMobile = detailsForm.watch("mobile");
  const nameValue = detailsForm.watch("name");

  // ===== Handlers (thin wrappers) =====

  async function handleSendOtp(data: RegisterDetailsForm) {
    setIsSubmitting(true);
    const res = await handlers.sendOtp(data);
    if (res.success) { setStep("otp"); otpForm.setValue("mobile", data.mobile); otpTimer.start(); }
    if (res.devOtp) setDevOtp(res.devOtp);
    setIsSubmitting(false);
  }

  async function handleResendOtp() {
    const mobile = otpForm.getValues("mobile");
    if (!mobile || !otpTimer.canResend) return;
    setIsSubmitting(true);
    const res = await handlers.resendOtp(mobile);
    if (res.success) otpTimer.start();
    if (res.devOtp) setDevOtp(res.devOtp);
    setIsSubmitting(false);
  }

  async function handleVerifyOtp(data: RegisterOtpForm) {
    setIsSubmitting(true);
    const name = detailsForm.getValues("name");
    const res = await handlers.verifyOtp(data, name);
    if (res.success && res.data) onSuccess?.(res.data);
    setIsSubmitting(false);
  }

  // ===== Render =====

  return (
    <GlassmorphismCard>
      {/* Header */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-rose-500 to-pink-500 shadow-lg shadow-rose-500/30 mb-4">
          <User className="h-7 w-7 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-foreground tracking-tight">{t("auth.registerTitle")}</h2>
        <p className="text-sm text-muted-foreground mt-1">{t("auth.registerSubtitle")}</p>
      </div>

      {/* Step Indicator */}
      <StepIndicator step={step} t={t} />

      {/* Dev OTP Banner */}
      {devOtp && step === "otp" && <DevOtpBanner devOtp={devOtp} t={t} />}

      {/* Step 1: Details */}
      {step === "details" && (
        <form onSubmit={detailsForm.handleSubmit(handleSendOtp)} className="space-y-5">
          <FloatingLabelInput label={t("auth.name")} type="text" icon={<User className="h-4.5 w-4.5" />} error={detailsForm.formState.errors.name?.message} registerProps={detailsForm.register("name")} />
          <FloatingLabelInput label={t("auth.mobileNumber")} type="tel" icon={<Phone className="h-4.5 w-4.5" />} error={detailsForm.formState.errors.mobile?.message} registerProps={detailsForm.register("mobile")} />
          <GradientButton loading={isSubmitting} disabled={!detailsForm.formState.isValid}><Phone className="mr-2 h-4 w-4" />{t("auth.sendOtp")}</GradientButton>
        </form>
      )}

      {/* Step 2: OTP Verify */}
      {step === "otp" && (
        <form onSubmit={otpForm.handleSubmit(handleVerifyOtp)} className="space-y-5">
          <DetailsSummary name={nameValue} mobile={watchedMobile} onChangeDetails={() => { setStep("details"); setDevOtp(null); otpForm.reset(); otpForm.setValue("otp", ""); }} t={t} />
          <OtpInput value={otpForm.watch("otp") || ""} onChange={(val) => otpForm.setValue("otp", val, { shouldValidate: true })} error={otpForm.formState.errors.otp?.message} disabled={isSubmitting} />
          <GradientButton loading={isSubmitting} disabled={!otpForm.formState.isValid}><CheckCircle2 className="mr-2 h-4 w-4" />{t("auth.verifyAndRegister")}</GradientButton>
          <ResendTimer timer={otpTimer} onResend={handleResendOtp} disabled={isSubmitting} t={t} />
        </form>
      )}

      {/* Footer */}
      <div className="flex items-center gap-3 mt-6"><div className="flex-1 h-px bg-gradient-to-r from-transparent via-muted to-transparent" /></div>
      <div className="text-center mt-5"><p className="text-sm text-muted-foreground">{t("auth.hasAccount")}{" "}<button type="button" className="text-primary font-semibold hover:underline underline-offset-2" onClick={onSwitchToLogin}>{t("auth.login")}</button></p></div>
    </GlassmorphismCard>
  );
}

// ==================== Sub-components ====================

function GradientButton({ loading, disabled, children }: { loading: boolean; disabled: boolean; children: React.ReactNode }) {
  return <Button type="submit" className="w-full h-12 rounded-xl bg-gradient-to-r from-rose-600 to-pink-500 hover:from-rose-700 hover:to-pink-600 text-white font-semibold shadow-lg shadow-rose-500/25 hover:shadow-rose-500/40 transition-all duration-300 disabled:opacity-50" disabled={loading || disabled}>{loading ? <Loader2 className="h-5 w-5 animate-spin" /> : children}</Button>;
}

function StepIndicator({ step, t }: { step: "details" | "otp"; t: (k: string) => string }) {
  return (
    <div className="flex items-center justify-center gap-0 mb-6">
      <div className="flex items-center gap-2">
        <div className={`flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold transition-all duration-300 ${step === "details" ? "bg-gradient-to-br from-rose-500 to-pink-500 text-white shadow-md shadow-rose-500/30" : "bg-green-500 text-white shadow-md shadow-green-500/20"}`}>{step === "otp" ? <CheckCircle2 className="h-4 w-4" /> : "1"}</div>
        <span className={`text-xs font-medium ${step === "details" ? "text-primary" : "text-green-600 dark:text-green-400"}`}>{t("auth.yourDetails")}</span>
      </div>
      <div className={`w-10 h-0.5 mx-2 rounded-full transition-colors duration-300 ${step === "otp" ? "bg-green-400" : "bg-muted"}`} />
      <div className="flex items-center gap-2">
        <div className={`flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold transition-all duration-300 ${step === "otp" ? "bg-gradient-to-br from-rose-500 to-pink-500 text-white shadow-md shadow-rose-500/30" : "bg-muted text-muted-foreground"}`}>2</div>
        <span className={`text-xs font-medium ${step === "otp" ? "text-primary" : "text-muted-foreground"}`}>{t("auth.verifyOtp")}</span>
      </div>
    </div>
  );
}

function DevOtpBanner({ devOtp, t }: { devOtp: string; t: (k: string) => string }) {
  return <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-center mb-4 dark:bg-amber-900/20 dark:border-amber-800"><p className="text-sm font-medium text-amber-800 dark:text-amber-200">{t("auth.devOtp")}: <span className="font-bold text-lg tracking-wider">{devOtp}</span></p></div>;
}

function DetailsSummary({ name, mobile, onChangeDetails, t }: { name: string; mobile: string; onChangeDetails: () => void; t: (k: string) => string }) {
  return (
    <div className="bg-gradient-to-r from-rose-50 to-pink-50 dark:from-rose-950/20 dark:to-pink-950/20 rounded-xl p-4 space-y-2 border border-rose-100 dark:border-rose-900/30">
      <div className="flex justify-between text-sm"><span className="text-muted-foreground">{t("auth.name")}:</span><span className="font-semibold text-foreground">{name}</span></div>
      <div className="flex justify-between text-sm"><span className="text-muted-foreground">{t("auth.mobileNumber")}:</span><span className="font-semibold text-foreground">{mobile}</span></div>
      <button type="button" className="text-xs text-primary font-medium hover:underline" onClick={onChangeDetails}>{t("auth.changeDetails")}</button>
    </div>
  );
}

function ResendTimer({ timer, onResend, disabled, t }: { timer: { isRunning: boolean; secondsLeft: number; canResend: boolean }; onResend: () => void; disabled: boolean; t: (k: string) => string }) {
  return <div className="text-center pt-1">{timer.isRunning ? <p className="text-sm text-muted-foreground flex items-center justify-center gap-1.5"><Timer className="h-3.5 w-3.5 animate-pulse" />{t("auth.resendIn")} <span className="font-semibold text-foreground tabular-nums">{timer.secondsLeft}s</span></p> : <button type="button" className="text-sm text-primary font-medium hover:underline" onClick={onResend} disabled={disabled}>{t("auth.resendOtp")}</button>}</div>;
}
