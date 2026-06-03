/**
 * @file Login form logic hook — ALL state & handlers, ZERO UI
 *
 * PURPOSE:
 *   Encapsulate every piece of login form logic (state, form instances,
 *   API handlers, OTP timer) into a single hook. The UI component just
 *   calls this hook and renders the returned data.
 *
 * LOGIN METHODS SUPPORTED:
 *   1. Phone OTP — Send OTP to mobile, verify
 *   2. Email OTP — Send OTP to email, verify
 *   3. Email + Password — Traditional login
 *
 * VIEW STRUCTURE:
 *   view: "otp" | "password"
 *     OTP view has sub-methods: otpMethod "phone" | "email"
 *     Password view: email + password form
 */

import { useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useOtpTimer } from "@/features/auth/hooks/use-otp-timer";
import { useLoginHandlers } from "@/features/auth/logic/login-handlers";
import {
  otpSendSchema,
  emailOtpSendSchema,
  otpVerifySchema,
  emailLoginSchema,
} from "@/features/auth/logic/auth-schemas";
import type {
  OtpSendForm,
  EmailOtpSendForm,
  OtpVerifyForm,
  EmailLoginForm,
  LoginSuccessData,
} from "@/features/auth/logic/auth-schemas";

/** Props accepted by the hook */
interface UseLoginFormOptions {
  /** Called when login succeeds — receives user + token data */
  onSuccess?: (data: LoginSuccessData) => void;
  /** Called when user clicks "Register" — navigates to register page */
  onSwitchToRegister?: (mobile?: string) => void;
}

/** Return type of useLoginForm — everything the UI needs */
export interface LoginFormState {
  // ── View state ──
  view: "otp" | "password";
  setView: (view: "otp" | "password") => void;
  otpMethod: "phone" | "email";
  setOtpMethod: (method: "phone" | "email") => void;

  // ── OTP flow state ──
  otpSent: boolean;
  devOtp: string | null;
  mobileNotFoundError: string | null;
  isSubmitting: boolean;
  watchedMobile: string;
  watchedEmail: string;

  // ── Form instances ──
  otpSendForm: ReturnType<typeof useForm<OtpSendForm>>;
  emailOtpSendForm: ReturnType<typeof useForm<EmailOtpSendForm>>;
  otpVerifyForm: ReturnType<typeof useForm<OtpVerifyForm>>;
  emailForm: ReturnType<typeof useForm<EmailLoginForm>>;

  // ── OTP timer ──
  otpTimer: {
    isRunning: boolean;
    secondsLeft: number;
    canResend: boolean;
    start: () => void;
  };

  // ── Handlers ──
  handleSendOtp: (data: OtpSendForm) => Promise<void>;
  handleSendEmailOtp: (data: EmailOtpSendForm) => Promise<void>;
  handleResendOtp: () => Promise<void>;
  handleVerifyOtp: (data: OtpVerifyForm) => Promise<void>;
  handleEmailLogin: (data: EmailLoginForm) => Promise<void>;
  resetOtpFlow: () => void;
  handleChangeNumber: () => void;
}

export function useLoginForm(options: UseLoginFormOptions): LoginFormState {
  const { onSuccess } = options;

  // ── API handler layer (pure logic, returns structured results) ──
  const handlers = useLoginHandlers();

  // ── OTP timer (30s cooldown between resend attempts) ──
  const otpTimer = useOtpTimer(30);

  // ── Local UI state ──
  const [view, setView] = useState<"otp" | "password">("otp");
  const [otpMethod, setOtpMethod] = useState<"phone" | "email">("phone");
  const [otpSent, setOtpSent] = useState(false);
  const [devOtp, setDevOtp] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mobileNotFoundError, setMobileNotFoundError] = useState<string | null>(null);

  // ── Form instances (react-hook-form + Zod validation) ──
  const otpSendForm = useForm<OtpSendForm>({
    resolver: zodResolver(otpSendSchema),
    defaultValues: { mobile: "" },
    mode: "onChange",
  });

  const emailOtpSendForm = useForm<EmailOtpSendForm>({
    resolver: zodResolver(emailOtpSendSchema),
    defaultValues: { email: "" },
    mode: "onChange",
  });

  const otpVerifyForm = useForm<OtpVerifyForm>({
    resolver: zodResolver(otpVerifySchema),
    defaultValues: { mobile: "", email: "", otp: "" },
    mode: "onChange",
  });

  const emailForm = useForm<EmailLoginForm>({
    resolver: zodResolver(emailLoginSchema),
    defaultValues: { email: "", password: "" },
    mode: "onChange",
  });

  /** Watch values for display */
  const watchedMobile = otpSendForm.watch("mobile");
  const watchedEmail = emailOtpSendForm.watch("email");

  /**
   * Send OTP to the user's mobile number (Phone OTP method).
   */
  const handleSendOtp = useCallback(async (data: OtpSendForm) => {
    setIsSubmitting(true);
    setMobileNotFoundError(null);

    const res = await handlers.sendOtp(data);

    if (res.success) {
      setOtpSent(true);
      otpVerifyForm.setValue("mobile", data.mobile);
      otpTimer.start();
    }
    if (res.devOtp) setDevOtp(res.devOtp);
    if (res.mobileNotFoundError) setMobileNotFoundError(res.mobileNotFoundError);

    setIsSubmitting(false);
  }, [handlers, otpTimer, otpVerifyForm]);

  /**
   * Send OTP to the user's email address (Email OTP method).
   */
  const handleSendEmailOtp = useCallback(async (data: EmailOtpSendForm) => {
    setIsSubmitting(true);
    setMobileNotFoundError(null);

    const res = await handlers.sendEmailOtp(data);

    if (res.success) {
      setOtpSent(true);
      otpVerifyForm.setValue("email", data.email);
      otpTimer.start();
    }
    if (res.devOtp) setDevOtp(res.devOtp);

    setIsSubmitting(false);
  }, [handlers, otpTimer, otpVerifyForm]);

  /**
   * Resend OTP after the cooldown timer expires.
   */
  const handleResendOtp = useCallback(async () => {
    if (!otpTimer.canResend) return;

    setIsSubmitting(true);

    if (otpMethod === "phone") {
      const mobile = otpVerifyForm.getValues("mobile");
      if (mobile) {
        const res = await handlers.resendOtp(mobile);
        if (res.success) otpTimer.start();
        if (res.devOtp) setDevOtp(res.devOtp);
      }
    } else {
      const email = otpVerifyForm.getValues("email");
      if (email) {
        const res = await handlers.resendEmailOtp(email);
        if (res.success) otpTimer.start();
        if (res.devOtp) setDevOtp(res.devOtp);
      }
    }

    setIsSubmitting(false);
  }, [handlers, otpTimer, otpVerifyForm, otpMethod]);

  /**
   * Verify the OTP the user entered.
   */
  const handleVerifyOtp = useCallback(async (data: OtpVerifyForm) => {
    setIsSubmitting(true);

    const res = await handlers.verifyOtp(data);

    if (res.success && res.data) onSuccess?.(res.data);
    if (res.mobileNotFoundError) setMobileNotFoundError(res.mobileNotFoundError);

    setIsSubmitting(false);
  }, [handlers, onSuccess]);

  /**
   * Login via email + password (alternative to OTP).
   */
  const handleEmailLogin = useCallback(async (data: EmailLoginForm) => {
    setIsSubmitting(true);

    const res = await handlers.emailLogin(data);

    if (res.success && res.data) onSuccess?.(res.data);

    setIsSubmitting(false);
  }, [handlers, onSuccess]);

  /** Reset the OTP flow back to "enter mobile/email" step */
  const resetOtpFlow = useCallback(() => {
    setOtpSent(false);
    setDevOtp(null);
    setMobileNotFoundError(null);
  }, []);

  /** Go back to mobile/email entry from OTP verification step */
  const handleChangeNumber = useCallback(() => {
    setOtpSent(false);
    setDevOtp(null);
    if (otpMethod === "phone") {
      otpSendForm.reset();
    } else {
      emailOtpSendForm.reset();
    }
    otpVerifyForm.setValue("otp", "");
  }, [otpSendForm, emailOtpSendForm, otpVerifyForm, otpMethod]);

  return {
    view, setView,
    otpMethod, setOtpMethod,
    otpSent, devOtp, mobileNotFoundError, isSubmitting,
    watchedMobile, watchedEmail,
    otpSendForm, emailOtpSendForm, otpVerifyForm, emailForm,
    otpTimer,
    handleSendOtp, handleSendEmailOtp, handleResendOtp, handleVerifyOtp, handleEmailLogin,
    resetOtpFlow, handleChangeNumber,
  };
}
