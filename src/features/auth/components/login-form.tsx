/**
 * @file Login form — Premium salon-style UI
 *
 * PURPOSE: Login via Mobile OTP or Email+Password with a beautiful,
 * professional design that matches a beauty parlour brand.
 *
 * ARCHITECTURE:
 *   - Uses useLoginForm hook for all logic (state, forms, handlers)
 *   - This file is PURE UI — no API calls, no useState
 *
 * DESIGN:
 *   - Glassmorphism card with frosted-glass effect
 *   - Floating label inputs with rose focus glow
 *   - Gradient tab switcher (OTP vs Email)
 *   - Individual OTP digit boxes with auto-advance
 *   - Gradient submit button with loading spinner
 *   - Dark mode fully supported with proper contrast
 */

"use client";

import { Phone, Mail, ArrowRight, Sparkles, AlertCircle, Timer, Loader2 } from "lucide-react";
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
  const form = useLoginForm({ onSuccess });

  return (
    <GlassmorphismCard>
      {/* ── Header ── */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-rose-500 to-pink-500 shadow-lg shadow-rose-500/30 mb-4">
          <Sparkles className="h-7 w-7 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
          {t("auth.loginTitle")}
        </h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
          {t("auth.loginSubtitle")}
        </p>
      </div>

      {/* ── Banners ── */}
      {form.devOtp && <DevOtpBanner devOtp={form.devOtp} t={t} />}
      {form.mobileNotFoundError && (
        <MobileNotRegisteredBanner
          message={form.mobileNotFoundError}
          mobile={form.watchedMobile}
          onRegister={onSwitchToRegister}
          t={t}
        />
      )}

      {/* ── Tab Switcher ── */}
      <TabSwitcher tab={form.tab} setTab={form.setTab} resetOtp={form.resetOtpFlow} t={t} />

      {/* ── OTP Send ── */}
      {form.tab === "otp" && !form.otpSent && (
        <form onSubmit={form.otpSendForm.handleSubmit(form.handleSendOtp)} className="space-y-6">
          <FloatingLabelInput
            label={t("auth.mobileNumber")}
            type="tel"
            icon={<Phone className="h-[18px] w-[18px]" />}
            error={form.otpSendForm.formState.errors.mobile?.message}
            registerProps={form.otpSendForm.register("mobile")}
          />
          <GradientButton loading={form.isSubmitting} disabled={!form.otpSendForm.formState.isValid}>
            {t("auth.sendOtp")} <ArrowRight className="ml-2 h-4 w-4" />
          </GradientButton>
        </form>
      )}

      {/* ── OTP Verify ── */}
      {form.tab === "otp" && form.otpSent && (
        <form onSubmit={form.otpVerifyForm.handleSubmit(form.handleVerifyOtp)} className="space-y-6">
          <div className="flex items-center justify-between text-sm">
            <span className="text-zinc-500 dark:text-zinc-400">
              {t("auth.otpSentTo")} <span className="font-semibold text-zinc-900 dark:text-zinc-100">{form.watchedMobile}</span>
            </span>
            <button type="button" className="text-rose-500 text-xs font-medium hover:underline" onClick={form.handleChangeNumber}>
              {t("auth.changeNumber")}
            </button>
          </div>
          <OtpInput
            value={form.otpVerifyForm.watch("otp") || ""}
            onChange={(val) => form.otpVerifyForm.setValue("otp", val, { shouldValidate: true })}
            error={form.otpVerifyForm.formState.errors.otp?.message}
            disabled={form.isSubmitting}
          />
          <GradientButton loading={form.isSubmitting} disabled={!form.otpVerifyForm.formState.isValid}>
            {t("auth.verifyOtp")}
          </GradientButton>
          <ResendTimer timer={form.otpTimer} onResend={form.handleResendOtp} disabled={form.isSubmitting} t={t} />
        </form>
      )}

      {/* ── Email Login ── */}
      {form.tab === "email" && (
        <form onSubmit={form.emailForm.handleSubmit(form.handleEmailLogin)} className="space-y-6">
          <FloatingLabelInput
            label={t("auth.email")}
            type="email"
            icon={<Mail className="h-[18px] w-[18px]" />}
            error={form.emailForm.formState.errors.email?.message}
            registerProps={form.emailForm.register("email")}
          />
          <PasswordInput
            label={t("auth.password")}
            error={form.emailForm.formState.errors.password?.message}
            registerProps={form.emailForm.register("password")}
          />
          <GradientButton loading={form.isSubmitting} disabled={!form.emailForm.formState.isValid}>
            {t("auth.loginButton")} <ArrowRight className="ml-2 h-4 w-4" />
          </GradientButton>
        </form>
      )}

      {/* ── Footer ── */}
      <div className="flex items-center gap-3 mt-8">
        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-zinc-200 dark:via-zinc-700 to-transparent" />
        <span className="text-xs text-zinc-400 dark:text-zinc-500">{t("auth.orLoginWith")}</span>
        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-zinc-200 dark:via-zinc-700 to-transparent" />
      </div>
      <div className="text-center mt-5">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          {t("auth.noAccount")}{" "}
          <button type="button" className="text-rose-500 font-semibold hover:underline underline-offset-2" onClick={() => onSwitchToRegister?.()}>
            {t("auth.register")}
          </button>
        </p>
      </div>
    </GlassmorphismCard>
  );
}
