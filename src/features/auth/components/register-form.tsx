/**
 * @file Register form — PURE UI component
 *
 * PURPOSE:
 *   Renders the 2-step registration form (details → OTP verification).
 *   All state and logic lives in useRegisterForm() — this file ONLY renders JSX.
 *
 * ARCHITECTURE:
 *   useRegisterForm() ──→ RegisterFormState ──→ JSX rendering
 *   (logic hook)          (data bridge)          (this file)
 *
 * RULES FOR THIS FILE:
 *   - NO useState, NO useForm, NO API calls
 *   - NO handler functions (all come from the hook)
 *   - ONLY imports: the hook, UI components, icons, translation
 *   - Target: <100 lines of actual JSX
 */

"use client";

import { Phone, User, Mail, AtSign, CheckCircle2 } from "lucide-react";
import { useTranslation } from "@/i18n/use-translation";
import { useRegisterForm } from "@/features/auth/hooks/use-register-form";
import type { RegisterSuccessData } from "@/features/auth/logic/auth-schemas";
import { GlassmorphismCard } from "@/components/ui/glassmorphism-card";
import { FloatingLabelInput } from "@/components/ui/floating-label-input";
import { PasswordInput } from "@/components/ui/password-input";
import { OtpInput } from "@/components/ui/otp-input";
import { GradientButton } from "./shared/gradient-button";
import { DevOtpBanner } from "./shared/dev-otp-banner";
import { StepIndicator } from "./shared/step-indicator";
import { DetailsSummary } from "./shared/details-summary";
import { ResendTimer } from "./shared/resend-timer";

interface RegisterFormProps {
  onSuccess?: (data: RegisterSuccessData) => void;
  onSwitchToLogin?: () => void;
  prefilledMobile?: string;
}

export function RegisterForm({ onSuccess, onSwitchToLogin, prefilledMobile }: RegisterFormProps) {
  const { t } = useTranslation();
  const form = useRegisterForm({ onSuccess, prefilledMobile });

  return (
    <GlassmorphismCard>
      {/* ── Header: brand icon + title + subtitle ── */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-rose-500 to-pink-500 shadow-lg shadow-rose-500/30 mb-4">
          <User className="h-7 w-7 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-foreground tracking-tight">{t("auth.registerTitle")}</h2>
        <p className="text-sm text-muted-foreground mt-1">{t("auth.registerSubtitle")}</p>
      </div>

      {/* ── Step indicator ── */}
      <StepIndicator step={form.step} t={t} />

      {/* ── Dev OTP banner (only in dev mode) ── */}
      {form.devOtp && form.step === "otp" && <DevOtpBanner devOtp={form.devOtp} t={t} />}

      {/* ── Step 1: Full registration details ── */}
      {form.step === "details" && (
        <form onSubmit={form.detailsForm.handleSubmit(form.handleSendOtp)} className="space-y-4">
          <FloatingLabelInput label={t("auth.name")} type="text" icon={<User className="h-4.5 w-4.5" />} error={form.detailsForm.formState.errors.name?.message} registerProps={form.detailsForm.register("name")} />
          <FloatingLabelInput label={t("auth.username")} type="text" icon={<AtSign className="h-4.5 w-4.5" />} error={form.detailsForm.formState.errors.username?.message} registerProps={form.detailsForm.register("username")} />
          <FloatingLabelInput label={t("auth.email")} type="email" icon={<Mail className="h-4.5 w-4.5" />} error={form.detailsForm.formState.errors.email?.message} registerProps={form.detailsForm.register("email")} />
          <PasswordInput label={t("auth.password")} error={form.detailsForm.formState.errors.password?.message} registerProps={form.detailsForm.register("password")} />
          <PasswordInput label={t("auth.confirmPassword")} error={form.detailsForm.formState.errors.confirmPassword?.message} registerProps={form.detailsForm.register("confirmPassword")} />
          <FloatingLabelInput label={t("auth.mobileNumber")} type="tel" icon={<Phone className="h-4.5 w-4.5" />} error={form.detailsForm.formState.errors.mobile?.message} registerProps={form.detailsForm.register("mobile")} />
          <GradientButton loading={form.isSubmitting} disabled={!form.detailsForm.formState.isValid}><Phone className="mr-2 h-4 w-4" />{t("auth.sendOtp")}</GradientButton>
        </form>
      )}

      {/* ── Step 2: OTP Verification ── */}
      {form.step === "otp" && (
        <form onSubmit={form.otpForm.handleSubmit(form.handleVerifyOtp)} className="space-y-5">
          <DetailsSummary name={form.nameValue} username={form.usernameValue} email={form.emailValue} mobile={form.watchedMobile} onChangeDetails={form.handleChangeDetails} t={t} />
          <OtpInput value={form.otpForm.watch("otp") || ""} onChange={(val) => form.otpForm.setValue("otp", val, { shouldValidate: true })} error={form.otpForm.formState.errors.otp?.message} disabled={form.isSubmitting} />
          <GradientButton loading={form.isSubmitting} disabled={!form.otpForm.formState.isValid}><CheckCircle2 className="mr-2 h-4 w-4" />{t("auth.verifyAndRegister")}</GradientButton>
          <ResendTimer timer={form.otpTimer} onResend={form.handleResendOtp} disabled={form.isSubmitting} t={t} />
        </form>
      )}

      {/* ── Footer: divider + login link ── */}
      <div className="flex items-center gap-3 mt-6"><div className="flex-1 h-px bg-gradient-to-r from-transparent via-muted to-transparent" /></div>
      <div className="text-center mt-5"><p className="text-sm text-muted-foreground">{t("auth.hasAccount")}{" "}<button type="button" className="text-primary font-semibold hover:underline underline-offset-2" onClick={onSwitchToLogin}>{t("auth.login")}</button></p></div>
    </GlassmorphismCard>
  );
}
