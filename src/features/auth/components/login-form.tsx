/**
 * @file Login form — PURE UI component
 *
 * PURPOSE:
 *   Renders the login form with two methods: Mobile OTP and Email+Password.
 *   All state and logic lives in useLoginForm() — this file ONLY renders JSX.
 *
 * ARCHITECTURE:
 *   useLoginForm() ──→ LoginFormState ──→ JSX rendering
 *   (logic hook)       (data bridge)      (this file)
 *
 * RULES FOR THIS FILE:
 *   - NO useState, NO useForm, NO API calls
 *   - NO handler functions (all come from the hook)
 *   - ONLY imports: the hook, UI components, icons, translation
 *   - Target: <100 lines of actual JSX
 */

"use client";

import { Phone, Mail, ArrowRight, Sparkles } from "lucide-react";
import { useTranslation } from "@/i18n/use-translation";
import { useLoginForm } from "@/features/auth/hooks/use-login-form";
import type { LoginSuccessData } from "@/features/auth/logic/auth-schemas";
import { GlassmorphismCard } from "@/components/ui/glassmorphism-card";
import { FloatingLabelInput } from "@/components/ui/floating-label-input";
import { PasswordInput } from "@/components/ui/password-input";
import { OtpInput } from "@/components/ui/otp-input";
import { GradientButton } from "./shared/gradient-button";
import { DevOtpBanner } from "./shared/dev-otp-banner";
import { MobileNotRegisteredBanner } from "./shared/mobile-not-registered-banner";
import { TabSwitcher } from "./shared/tab-switcher";
import { ResendTimer } from "./shared/resend-timer";

interface LoginFormProps {
  onSuccess?: (data: LoginSuccessData) => void;
  onSwitchToRegister?: (mobile?: string) => void;
}

export function LoginForm({ onSuccess, onSwitchToRegister }: LoginFormProps) {
  const { t } = useTranslation();
  const form = useLoginForm({ onSuccess, onSwitchToRegister });

  return (
    <GlassmorphismCard>
      {/* ── Header: brand icon + title + subtitle ── */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-rose-500 to-pink-500 shadow-lg shadow-rose-500/30 mb-4">
          <Sparkles className="h-7 w-7 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-foreground tracking-tight">{t("auth.loginTitle")}</h2>
        <p className="text-sm text-muted-foreground mt-1">{t("auth.loginSubtitle")}</p>
      </div>

      {/* ── Error banners ── */}
      {form.devOtp && <DevOtpBanner devOtp={form.devOtp} t={t} />}
      {form.mobileNotFoundError && (
        <MobileNotRegisteredBanner
          message={form.mobileNotFoundError}
          mobile={form.watchedMobile}
          onRegister={onSwitchToRegister}
          t={t}
        />
      )}

      {/* ── Tab switcher: OTP vs Email ── */}
      <TabSwitcher tab={form.tab} setTab={form.setTab} resetOtp={form.resetOtpFlow} t={t} />

      {/* ── OTP Send step ── */}
      {form.tab === "otp" && !form.otpSent && (
        <form onSubmit={form.otpSendForm.handleSubmit(form.handleSendOtp)} className="space-y-5">
          <FloatingLabelInput label={t("auth.mobileNumber")} type="tel" icon={<Phone className="h-4.5 w-4.5" />} error={form.otpSendForm.formState.errors.mobile?.message} registerProps={form.otpSendForm.register("mobile")} />
          <GradientButton loading={form.isSubmitting} disabled={!form.otpSendForm.formState.isValid}>{t("auth.sendOtp")}<ArrowRight className="ml-2 h-4 w-4" /></GradientButton>
        </form>
      )}

      {/* ── OTP Verify step ── */}
      {form.tab === "otp" && form.otpSent && (
        <form onSubmit={form.otpVerifyForm.handleSubmit(form.handleVerifyOtp)} className="space-y-5">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{t("auth.otpSentTo")} <span className="font-semibold text-foreground">{form.watchedMobile}</span></span>
            <button type="button" className="text-primary text-xs font-medium hover:underline" onClick={form.handleChangeNumber}>{t("auth.changeNumber")}</button>
          </div>
          <OtpInput value={form.otpVerifyForm.watch("otp") || ""} onChange={(val) => form.otpVerifyForm.setValue("otp", val, { shouldValidate: true })} error={form.otpVerifyForm.formState.errors.otp?.message} disabled={form.isSubmitting} />
          <GradientButton loading={form.isSubmitting} disabled={!form.otpVerifyForm.formState.isValid}>{t("auth.verifyOtp")}</GradientButton>
          <ResendTimer timer={form.otpTimer} onResend={form.handleResendOtp} disabled={form.isSubmitting} t={t} />
        </form>
      )}

      {/* ── Email Login ── */}
      {form.tab === "email" && (
        <form onSubmit={form.emailForm.handleSubmit(form.handleEmailLogin)} className="space-y-5">
          <FloatingLabelInput label={t("auth.email")} type="email" icon={<Mail className="h-4.5 w-4.5" />} error={form.emailForm.formState.errors.email?.message} registerProps={form.emailForm.register("email")} />
          <PasswordInput label={t("auth.password")} error={form.emailForm.formState.errors.password?.message} registerProps={form.emailForm.register("password")} />
          <GradientButton loading={form.isSubmitting} disabled={!form.emailForm.formState.isValid}>{t("auth.loginButton")}<ArrowRight className="ml-2 h-4 w-4" /></GradientButton>
        </form>
      )}

      {/* ── Footer: divider + register link ── */}
      <div className="flex items-center gap-3 mt-6"><div className="flex-1 h-px bg-gradient-to-r from-transparent via-muted to-transparent" /><span className="text-xs text-muted-foreground">{t("auth.orLoginWith")}</span><div className="flex-1 h-px bg-gradient-to-r from-transparent via-muted to-transparent" /></div>
      <div className="text-center mt-5"><p className="text-sm text-muted-foreground">{t("auth.noAccount")}{" "}<button type="button" className="text-primary font-semibold hover:underline underline-offset-2" onClick={() => onSwitchToRegister?.()}>{t("auth.register")}</button></p></div>
    </GlassmorphismCard>
  );
}
