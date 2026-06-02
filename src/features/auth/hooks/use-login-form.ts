/**
 * @file Login form logic hook — ALL state & handlers, ZERO UI
 *
 * PURPOSE:
 *   Encapsulate every piece of login form logic (state, form instances,
 *   API handlers, OTP timer) into a single hook. The UI component just
 *   calls this hook and renders the returned data.
 *
 * WHY SEPARATE LOGIC FROM UI?
 *   - Easier to test: you can unit-test the hook without rendering DOM
 *   - Cleaner code: UI file stays under 100 lines, logic file stays focused
 *   - Reusability: if we build a mobile app with React Native, same hook works
 *   - Debugging: all state transitions are in one place
 *
 * WHAT THIS HOOK MANAGES:
 *   - Tab state: "otp" vs "email" login method
 *   - OTP flow state: whether OTP is sent, dev OTP display
 *   - Submission loading state
 *   - Mobile-not-registered error banner state
 *   - Three react-hook-form instances (otpSend, otpVerify, emailLogin)
 *   - OTP timer (cooldown before resend)
 *   - All handler functions (sendOtp, resendOtp, verifyOtp, emailLogin)
 *
 * WHAT THE UI COMPONENT DOES:
 *   - Calls useLoginForm()
 *   - Renders JSX using the hook's return values
 *   - NOTHING else — no useState, no useForm, no API calls
 */

import { useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useOtpTimer } from "@/features/auth/hooks/use-otp-timer";
import { useLoginHandlers } from "@/features/auth/logic/login-handlers";
import {
  otpSendSchema,
  otpVerifySchema,
  emailLoginSchema,
} from "@/features/auth/logic/auth-schemas";
import type {
  OtpSendForm,
  OtpVerifyForm,
  EmailLoginForm,
  LoginSuccessData,
} from "@/features/auth/logic/auth-schemas";

/** Props accepted by the hook (same as LoginFormProps) */
interface UseLoginFormOptions {
  /** Called when login succeeds — receives user + token data */
  onSuccess?: (data: LoginSuccessData) => void;
  /** Called when user clicks "Register" — navigates to register page */
  onSwitchToRegister?: (mobile?: string) => void;
}

/** Return type of useLoginForm — everything the UI needs */
export interface LoginFormState {
  // ── Tab state ──
  tab: "otp" | "email";
  setTab: (tab: "otp" | "email") => void;

  // ── OTP flow state ──
  otpSent: boolean;
  devOtp: string | null;
  mobileNotFoundError: string | null;
  isSubmitting: boolean;
  watchedMobile: string;

  // ── Form instances ──
  otpSendForm: ReturnType<typeof useForm<OtpSendForm>>;
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
  const [tab, setTab] = useState<"otp" | "email">("otp");
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

  const otpVerifyForm = useForm<OtpVerifyForm>({
    resolver: zodResolver(otpVerifySchema),
    defaultValues: { mobile: "", otp: "" },
    mode: "onChange",
  });

  const emailForm = useForm<EmailLoginForm>({
    resolver: zodResolver(emailLoginSchema),
    defaultValues: { email: "", password: "" },
    mode: "onChange",
  });

  /** Watch mobile for display in "OTP sent to 98XXX" text */
  const watchedMobile = otpSendForm.watch("mobile");

  /**
   * Send OTP to the user's mobile number.
   *
   * FLOW:
   *   1. Set loading state
   *   2. Call API via handlers.sendOtp()
   *   3. On success: mark OTP as sent, copy mobile to verify form, start timer
   *   4. On "not registered" error: show banner with register link
   *   5. In dev mode: display the OTP on screen for testing
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
   * Resend OTP after the cooldown timer expires.
   *
   * GUARDS:
   *   - Won't send if no mobile number is available
   *   - Won't send if the timer hasn't expired (otpTimer.canResend)
   */
  const handleResendOtp = useCallback(async () => {
    const mobile = otpVerifyForm.getValues("mobile");
    if (!mobile || !otpTimer.canResend) return;

    setIsSubmitting(true);
    const res = await handlers.resendOtp(mobile);

    if (res.success) otpTimer.start();
    if (res.devOtp) setDevOtp(res.devOtp);

    setIsSubmitting(false);
  }, [handlers, otpTimer, otpVerifyForm]);

  /**
   * Verify the OTP the user entered.
   *
   * On success: calls onSuccess callback → auth store + redirect handled by parent
   * On "not registered" error: shows the mobile-not-registered banner
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
   *
   * On success: calls onSuccess callback → auth store + redirect handled by parent
   */
  const handleEmailLogin = useCallback(async (data: EmailLoginForm) => {
    setIsSubmitting(true);

    const res = await handlers.emailLogin(data);

    if (res.success && res.data) onSuccess?.(res.data);

    setIsSubmitting(false);
  }, [handlers, onSuccess]);

  /** Reset the OTP flow back to "enter mobile" step */
  const resetOtpFlow = useCallback(() => {
    setOtpSent(false);
    setDevOtp(null);
    setMobileNotFoundError(null);
  }, []);

  /** Go back to mobile entry from OTP verification step */
  const handleChangeNumber = useCallback(() => {
    setOtpSent(false);
    setDevOtp(null);
    otpSendForm.reset();
    otpVerifyForm.setValue("otp", "");
  }, [otpSendForm, otpVerifyForm]);

  return {
    tab, setTab,
    otpSent, devOtp, mobileNotFoundError, isSubmitting, watchedMobile,
    otpSendForm, otpVerifyForm, emailForm,
    otpTimer,
    handleSendOtp, handleResendOtp, handleVerifyOtp, handleEmailLogin,
    resetOtpFlow, handleChangeNumber,
  };
}
