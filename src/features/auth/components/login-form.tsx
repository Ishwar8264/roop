/**
 * @file Login form — PURE UI component
 *
 * PURPOSE:
 *   Renders the login form with three methods:
 *   1. Phone OTP — Send OTP to mobile, verify
 *   2. Email OTP — Send OTP to email, verify
 *   3. Email + Password — Traditional login
 *
 * ARCHITECTURE:
 *   useLoginForm() ──→ LoginFormState ──→ JSX rendering
 *   (logic hook)       (data bridge)      (this file)
 *
 * DESIGN (inspired by reference):
 *   - OTP method sub-tabs: Email | Phone (pill toggle)
 *   - Clean input fields with left icons
 *   - Gradient rose-pink primary buttons
 *   - "Sign in with password instead" link below OTP
 *   - "Sign in with one-time code instead" link below password form
 *   - OR divider between login methods
 */

"use client";

import { Phone, Mail, ArrowRight, Sparkles, MessageSquare, Lock } from "lucide-react";
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

      {/* ══════════════════════════════════════════════
          VIEW: OTP LOGIN (Phone OTP / Email OTP)
          ══════════════════════════════════════════════ */}
      {form.view === "otp" && !form.otpSent && (
        <>
          {/* ── OTP Method Sub-Tabs: Email | Phone ── */}
          <div className="relative flex bg-muted/50 rounded-xl p-1 mb-6">
            {/* Sliding gradient pill background */}
            <div
              className={`absolute top-1 bottom-1 rounded-lg bg-gradient-to-r from-rose-500 to-pink-500 shadow-md shadow-rose-500/25 transition-all duration-300 ease-out ${
                form.otpMethod === "email"
                  ? "left-1 w-[calc(50%-4px)]"
                  : "left-[calc(50%+2px)] w-[calc(50%-4px)]"
              }`}
            />
            {/* Email OTP tab */}
            <button
              type="button"
              onClick={() => { form.setOtpMethod("email"); form.resetOtpFlow(); }}
              className={`relative z-10 flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium transition-colors duration-300 ${
                form.otpMethod === "email" ? "text-white" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Mail className="h-4 w-4" />
              {t("auth.email")}
            </button>
            {/* Phone OTP tab */}
            <button
              type="button"
              onClick={() => { form.setOtpMethod("phone"); form.resetOtpFlow(); }}
              className={`relative z-10 flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium transition-colors duration-300 ${
                form.otpMethod === "phone" ? "text-white" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Phone className="h-4 w-4" />
              {t("auth.phone")}
            </button>
          </div>

          {/* ── Phone OTP: Send step ── */}
          {form.otpMethod === "phone" && (
            <form onSubmit={form.otpSendForm.handleSubmit(form.handleSendOtp)} className="space-y-5">
              <FloatingLabelInput
                label={t("auth.mobileNumber")}
                type="tel"
                icon={<Phone className="h-4.5 w-4.5" />}
                error={form.otpSendForm.formState.errors.mobile?.message}
                registerProps={form.otpSendForm.register("mobile")}
              />
              <GradientButton loading={form.isSubmitting} disabled={!form.otpSendForm.formState.isValid}>
                <MessageSquare className="mr-2 h-4 w-4" />
                {t("auth.sendCodeViaSms")}
              </GradientButton>
            </form>
          )}

          {/* ── Email OTP: Send step ── */}
          {form.otpMethod === "email" && (
            <form onSubmit={form.emailOtpSendForm.handleSubmit(form.handleSendEmailOtp)} className="space-y-5">
              <FloatingLabelInput
                label={t("auth.email")}
                type="email"
                icon={<Mail className="h-4.5 w-4.5" />}
                error={form.emailOtpSendForm.formState.errors.email?.message}
                registerProps={form.emailOtpSendForm.register("email")}
              />
              <GradientButton loading={form.isSubmitting} disabled={!form.emailOtpSendForm.formState.isValid}>
                <Mail className="mr-2 h-4 w-4" />
                {t("auth.sendCodeToEmail")}
              </GradientButton>
            </form>
          )}

          {/* ── OR divider ── */}
          <div className="flex items-center gap-3 mt-6">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-muted to-transparent" />
            <span className="text-xs text-muted-foreground">OR</span>
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-muted to-transparent" />
          </div>

          {/* ── Switch to password login ── */}
          <div className="text-center mt-4">
            <button
              type="button"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors font-medium inline-flex items-center gap-1.5"
              onClick={() => form.setView("password")}
            >
              <Lock className="h-3.5 w-3.5" />
              {t("auth.signInWithPassword")}
            </button>
          </div>
        </>
      )}

      {/* ── OTP Verify step (common for both phone & email) ── */}
      {form.view === "otp" && form.otpSent && (
        <form onSubmit={form.otpVerifyForm.handleSubmit(form.handleVerifyOtp)} className="space-y-5">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              {form.otpMethod === "phone"
                ? <>OTP sent to <span className="font-semibold text-foreground">{form.watchedMobile}</span></>
                : <>OTP sent to <span className="font-semibold text-foreground">{form.watchedEmail}</span></>
              }
            </span>
            <button
              type="button"
              className="text-primary text-xs font-medium hover:underline"
              onClick={form.handleChangeNumber}
            >
              {form.otpMethod === "phone" ? t("auth.changeNumber") : t("auth.changeDetails")}
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

      {/* ══════════════════════════════════════════════
          VIEW: EMAIL + PASSWORD LOGIN
          ══════════════════════════════════════════════ */}
      {form.view === "password" && (
        <>
          <form onSubmit={form.emailForm.handleSubmit(form.handleEmailLogin)} className="space-y-5">
            <FloatingLabelInput
              label={t("auth.email")}
              type="email"
              icon={<Mail className="h-4.5 w-4.5" />}
              error={form.emailForm.formState.errors.email?.message}
              registerProps={form.emailForm.register("email")}
            />
            <PasswordInput
              label={t("auth.password")}
              error={form.emailForm.formState.errors.password?.message}
              registerProps={form.emailForm.register("password")}
            />
            <GradientButton loading={form.isSubmitting} disabled={!form.emailForm.formState.isValid}>
              {t("auth.loginButton")}
              <ArrowRight className="ml-2 h-4 w-4" />
            </GradientButton>
          </form>

          {/* ── OR divider ── */}
          <div className="flex items-center gap-3 mt-6">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-muted to-transparent" />
            <span className="text-xs text-muted-foreground">OR</span>
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-muted to-transparent" />
          </div>

          {/* ── Switch to OTP login ── */}
          <div className="text-center mt-4">
            <button
              type="button"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors font-medium inline-flex items-center gap-1.5"
              onClick={() => { form.setView("otp"); form.resetOtpFlow(); }}
            >
              <MessageSquare className="h-3.5 w-3.5" />
              {t("auth.signInWithOtp")}
            </button>
          </div>
        </>
      )}

      {/* ── Footer: register link ── */}
      <div className="text-center mt-6">
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
    </GlassmorphismCard>
  );
}
