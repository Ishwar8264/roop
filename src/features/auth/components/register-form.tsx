/**
 * @file Register form — Premium salon-style UI
 *
 * PURPOSE: 2-step registration (name+mobile → OTP verification)
 * with a beautiful, professional salon-style design.
 *
 * ARCHITECTURE:
 *   - Uses useRegisterForm hook for all logic (state, forms, handlers)
 *   - This file is PURE UI — no API calls, no useState
 *
 * DESIGN:
 *   - Same glassmorphism card + floating label style as login
 *   - Step indicator showing progress (details → OTP)
 *   - Details summary card in OTP step
 *   - Individual OTP digit boxes
 *   - Gradient submit button
 *   - Dark mode fully supported
 */

"use client";

import { Phone, User, CheckCircle2 } from "lucide-react";
import { useTranslation } from "@/i18n/use-translation";
import { useRegisterForm } from "@/features/auth/hooks/use-register-form";
import type { RegisterSuccessData } from "@/features/auth/logic/auth-schemas";
import { GlassmorphismCard } from "@/components/ui/glassmorphism-card";
import { FloatingLabelInput } from "@/components/ui/floating-label-input";
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
      {/* ── Header ── */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-rose-500 to-pink-500 shadow-lg shadow-rose-500/30 mb-4">
          <User className="h-7 w-7 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
          {t("auth.registerTitle")}
        </h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
          {t("auth.registerSubtitle")}
        </p>
      </div>

      {/* ── Step Indicator ── */}
      <StepIndicator step={form.step} t={t} />

      {/* ── Dev OTP Banner ── */}
      {form.devOtp && form.step === "otp" && <DevOtpBanner devOtp={form.devOtp} t={t} />}

      {/* ── Step 1: Details ── */}
      {form.step === "details" && (
        <form onSubmit={form.detailsForm.handleSubmit(form.handleSendOtp)} className="space-y-6">
          <FloatingLabelInput
            label={t("auth.name")}
            type="text"
            icon={<User className="h-[18px] w-[18px]" />}
            error={form.detailsForm.formState.errors.name?.message}
            registerProps={form.detailsForm.register("name")}
          />
          <FloatingLabelInput
            label={t("auth.mobileNumber")}
            type="tel"
            icon={<Phone className="h-[18px] w-[18px]" />}
            error={form.detailsForm.formState.errors.mobile?.message}
            registerProps={form.detailsForm.register("mobile")}
          />
          <GradientButton loading={form.isSubmitting} disabled={!form.detailsForm.formState.isValid}>
            <Phone className="mr-2 h-4 w-4" />{t("auth.sendOtp")}
          </GradientButton>
        </form>
      )}

      {/* ── Step 2: OTP Verify ── */}
      {form.step === "otp" && (
        <form onSubmit={form.otpForm.handleSubmit(form.handleVerifyOtp)} className="space-y-6">
          <DetailsSummary name={form.nameValue} mobile={form.watchedMobile} onChangeDetails={form.handleChangeDetails} t={t} />
          <OtpInput
            value={form.otpForm.watch("otp") || ""}
            onChange={(val) => form.otpForm.setValue("otp", val, { shouldValidate: true })}
            error={form.otpForm.formState.errors.otp?.message}
            disabled={form.isSubmitting}
          />
          <GradientButton loading={form.isSubmitting} disabled={!form.otpForm.formState.isValid}>
            <CheckCircle2 className="mr-2 h-4 w-4" />{t("auth.verifyAndRegister")}
          </GradientButton>
          <ResendTimer timer={form.otpTimer} onResend={form.handleResendOtp} disabled={form.isSubmitting} t={t} />
        </form>
      )}

      {/* ── Footer ── */}
      <div className="flex items-center gap-3 mt-8">
        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-zinc-200 dark:via-zinc-700 to-transparent" />
      </div>
      <div className="text-center mt-5">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          {t("auth.hasAccount")}{" "}
          <button type="button" className="text-rose-500 font-semibold hover:underline underline-offset-2" onClick={onSwitchToLogin}>
            {t("auth.login")}
          </button>
        </p>
      </div>
    </GlassmorphismCard>
  );
}
