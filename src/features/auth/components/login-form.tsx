/**
 * Purpose: Login form UI — renders form, delegates logic to login-handlers
 * Responsibility: UI only — no API calls, no toast logic
 * Lines: ~140
 */

"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Phone, Mail, ArrowRight, Loader2, Timer, AlertCircle, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/i18n/use-translation";
import { useOtpTimer } from "@/features/auth/hooks/use-otp-timer";
import { useLoginHandlers } from "@/features/auth/logic/login-handlers";
import { otpSendSchema, otpVerifySchema, emailLoginSchema } from "@/features/auth/logic/auth-schemas";
import type { OtpSendForm, OtpVerifyForm, EmailLoginForm, LoginSuccessData } from "@/features/auth/logic/auth-schemas";
import { GlassmorphismCard } from "./ui/glassmorphism-card";
import { FloatingLabelInput } from "./ui/floating-label-input";
import { PasswordInput } from "./ui/password-input";
import { OtpInput } from "./ui/otp-input";

interface LoginFormProps {
  onSuccess?: (data: LoginSuccessData) => void;
  onSwitchToRegister?: (mobile?: string) => void;
}

export function LoginForm({ onSuccess, onSwitchToRegister }: LoginFormProps) {
  const { t } = useTranslation();
  const handlers = useLoginHandlers();
  const otpTimer = useOtpTimer(30);

  const [tab, setTab] = useState<"otp" | "email">("otp");
  const [otpSent, setOtpSent] = useState(false);
  const [devOtp, setDevOtp] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mobileNotFoundError, setMobileNotFoundError] = useState<string | null>(null);

  const otpSendForm = useForm<OtpSendForm>({ resolver: zodResolver(otpSendSchema), defaultValues: { mobile: "" }, mode: "onChange" });
  const otpVerifyForm = useForm<OtpVerifyForm>({ resolver: zodResolver(otpVerifySchema), defaultValues: { mobile: "", otp: "" }, mode: "onChange" });
  const emailForm = useForm<EmailLoginForm>({ resolver: zodResolver(emailLoginSchema), defaultValues: { email: "", password: "" }, mode: "onChange" });

  const watchedMobile = otpSendForm.watch("mobile");

  // ===== Handlers (thin wrappers — delegate to logic layer) =====

  async function handleSendOtp(data: OtpSendForm) {
    setIsSubmitting(true); setMobileNotFoundError(null);
    const res = await handlers.sendOtp(data);
    if (res.success) { setOtpSent(true); otpVerifyForm.setValue("mobile", data.mobile); otpTimer.start(); }
    if (res.devOtp) setDevOtp(res.devOtp);
    if (res.mobileNotFoundError) setMobileNotFoundError(res.mobileNotFoundError);
    setIsSubmitting(false);
  }

  async function handleResendOtp() {
    const mobile = otpVerifyForm.getValues("mobile");
    if (!mobile || !otpTimer.canResend) return;
    setIsSubmitting(true);
    const res = await handlers.resendOtp(mobile);
    if (res.success) otpTimer.start();
    if (res.devOtp) setDevOtp(res.devOtp);
    setIsSubmitting(false);
  }

  async function handleVerifyOtp(data: OtpVerifyForm) {
    setIsSubmitting(true);
    const res = await handlers.verifyOtp(data);
    if (res.success && res.data) onSuccess?.(res.data);
    if (res.mobileNotFoundError) setMobileNotFoundError(res.mobileNotFoundError);
    setIsSubmitting(false);
  }

  async function handleEmailLogin(data: EmailLoginForm) {
    setIsSubmitting(true);
    const res = await handlers.emailLogin(data);
    if (res.success && res.data) onSuccess?.(res.data);
    setIsSubmitting(false);
  }

  // ===== Render =====

  return (
    <GlassmorphismCard>
      {/* Header */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-rose-500 to-pink-500 shadow-lg shadow-rose-500/30 mb-4">
          <Sparkles className="h-7 w-7 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-foreground tracking-tight">{t("auth.loginTitle")}</h2>
        <p className="text-sm text-muted-foreground mt-1">{t("auth.loginSubtitle")}</p>
      </div>

      {/* Banners */}
      {devOtp && <DevOtpBanner devOtp={devOtp} t={t} />}
      {mobileNotFoundError && <MobileNotRegisteredBanner message={mobileNotFoundError} mobile={watchedMobile} onRegister={onSwitchToRegister} t={t} />}

      {/* Tab Switcher */}
      <TabSwitcher tab={tab} setTab={setTab} resetOtp={() => { setOtpSent(false); setDevOtp(null); setMobileNotFoundError(null); }} t={t} />

      {/* OTP Send */}
      {tab === "otp" && !otpSent && (
        <form onSubmit={otpSendForm.handleSubmit(handleSendOtp)} className="space-y-5">
          <FloatingLabelInput label={t("auth.mobileNumber")} type="tel" icon={<Phone className="h-4.5 w-4.5" />} error={otpSendForm.formState.errors.mobile?.message} registerProps={otpSendForm.register("mobile")} />
          <GradientButton loading={isSubmitting} disabled={!otpSendForm.formState.isValid}>{t("auth.sendOtp")}<ArrowRight className="ml-2 h-4 w-4" /></GradientButton>
        </form>
      )}

      {/* OTP Verify */}
      {tab === "otp" && otpSent && (
        <form onSubmit={otpVerifyForm.handleSubmit(handleVerifyOtp)} className="space-y-5">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{t("auth.otpSentTo")} <span className="font-semibold text-foreground">{watchedMobile}</span></span>
            <button type="button" className="text-primary text-xs font-medium hover:underline" onClick={() => { setOtpSent(false); setDevOtp(null); otpSendForm.reset(); otpVerifyForm.setValue("otp", ""); }}>{t("auth.changeNumber")}</button>
          </div>
          <OtpInput value={otpVerifyForm.watch("otp") || ""} onChange={(val) => otpVerifyForm.setValue("otp", val, { shouldValidate: true })} error={otpVerifyForm.formState.errors.otp?.message} disabled={isSubmitting} />
          <GradientButton loading={isSubmitting} disabled={!otpVerifyForm.formState.isValid}>{t("auth.verifyOtp")}</GradientButton>
          <ResendTimer timer={otpTimer} onResend={handleResendOtp} disabled={isSubmitting} t={t} />
        </form>
      )}

      {/* Email Login */}
      {tab === "email" && (
        <form onSubmit={emailForm.handleSubmit(handleEmailLogin)} className="space-y-5">
          <FloatingLabelInput label={t("auth.email")} type="email" icon={<Mail className="h-4.5 w-4.5" />} error={emailForm.formState.errors.email?.message} registerProps={emailForm.register("email")} />
          <PasswordInput label={t("auth.password")} error={emailForm.formState.errors.password?.message} registerProps={emailForm.register("password")} />
          <GradientButton loading={isSubmitting} disabled={!emailForm.formState.isValid}>{t("auth.loginButton")}<ArrowRight className="ml-2 h-4 w-4" /></GradientButton>
        </form>
      )}

      {/* Footer */}
      <div className="flex items-center gap-3 mt-6"><div className="flex-1 h-px bg-gradient-to-r from-transparent via-muted to-transparent" /><span className="text-xs text-muted-foreground">{t("auth.orLoginWith")}</span><div className="flex-1 h-px bg-gradient-to-r from-transparent via-muted to-transparent" /></div>
      <div className="text-center mt-5"><p className="text-sm text-muted-foreground">{t("auth.noAccount")}{" "}<button type="button" className="text-primary font-semibold hover:underline underline-offset-2" onClick={() => onSwitchToRegister?.()}>{t("auth.register")}</button></p></div>
    </GlassmorphismCard>
  );
}

// ==================== Sub-components (small, focused) ====================

function GradientButton({ loading, disabled, children }: { loading: boolean; disabled: boolean; children: React.ReactNode }) {
  return <Button type="submit" className="w-full h-12 rounded-xl bg-gradient-to-r from-rose-600 to-pink-500 hover:from-rose-700 hover:to-pink-600 text-white font-semibold shadow-lg shadow-rose-500/25 hover:shadow-rose-500/40 transition-all duration-300 disabled:opacity-50" disabled={loading || disabled}>{loading ? <Loader2 className="h-5 w-5 animate-spin" /> : children}</Button>;
}

function DevOtpBanner({ devOtp, t }: { devOtp: string; t: (k: string) => string }) {
  return <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-center mb-4 dark:bg-amber-900/20 dark:border-amber-800"><p className="text-sm font-medium text-amber-800 dark:text-amber-200">{t("auth.devOtp")}: <span className="font-bold text-lg tracking-wider">{devOtp}</span></p></div>;
}

function MobileNotRegisteredBanner({ message, mobile, onRegister, t }: { message: string; mobile: string; onRegister?: (m?: string) => void; t: (k: string) => string }) {
  return <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-3 flex items-start gap-2.5 mb-4"><AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" /><div className="flex-1"><p className="text-sm font-medium text-destructive">{t("auth.mobileNotRegistered")}</p><p className="text-xs text-muted-foreground mt-0.5">{message}</p><button type="button" className="text-xs text-primary font-medium hover:underline mt-1" onClick={() => onRegister?.(mobile)}>{t("auth.registerFirst")} →</button></div></div>;
}

function TabSwitcher({ tab, setTab, resetOtp, t }: { tab: "otp" | "email"; setTab: (t: "otp" | "email") => void; resetOtp: () => void; t: (k: string) => string }) {
  return (
    <div className="relative flex bg-muted/50 rounded-xl p-1 mb-6">
      <div className={`absolute top-1 bottom-1 rounded-lg bg-gradient-to-r from-rose-500 to-pink-500 shadow-md shadow-rose-500/25 transition-all duration-300 ease-out ${tab === "otp" ? "left-1 w-[calc(50%-4px)]" : "left-[calc(50%+2px)] w-[calc(50%-4px)]"}`} />
      <button type="button" onClick={() => { setTab("otp"); resetOtp(); }} className={`relative z-10 flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium transition-colors duration-300 ${tab === "otp" ? "text-white" : "text-muted-foreground hover:text-foreground"}`}><Phone className="h-4 w-4" />{t("auth.mobileOtp")}</button>
      <button type="button" onClick={() => setTab("email")} className={`relative z-10 flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium transition-colors duration-300 ${tab === "email" ? "text-white" : "text-muted-foreground hover:text-foreground"}`}><Mail className="h-4 w-4" />{t("auth.email")}</button>
    </div>
  );
}

function ResendTimer({ timer, onResend, disabled, t }: { timer: { isRunning: boolean; secondsLeft: number; canResend: boolean }; onResend: () => void; disabled: boolean; t: (k: string) => string }) {
  return <div className="text-center pt-1">{timer.isRunning ? <p className="text-sm text-muted-foreground flex items-center justify-center gap-1.5"><Timer className="h-3.5 w-3.5 animate-pulse" />{t("auth.resendIn")} <span className="font-semibold text-foreground tabular-nums">{timer.secondsLeft}s</span></p> : <button type="button" className="text-sm text-primary font-medium hover:underline" onClick={onResend} disabled={disabled}>{t("auth.resendOtp")}</button>}</div>;
}
