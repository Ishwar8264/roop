/**
 * @file Register form logic hook — ALL state & handlers, ZERO UI
 *
 * PURPOSE:
 *   Encapsulate every piece of registration form logic (state, form instances,
 *   API handlers, OTP timer, step management) into a single hook.
 *   The UI component just calls this hook and renders the returned data.
 *
 * WHY SEPARATE LOGIC FROM UI?
 *   - Same reasons as useLoginForm: testability, cleanliness, reusability
 *   - Registration has a 2-step flow (details → OTP) — the step logic
 *     belongs in the hook, not scattered across the UI
 *
 * WHAT THIS HOOK MANAGES:
 *   - Step state: "details" (name+mobile) vs "otp" (verify code)
 *   - OTP flow state: dev OTP display, submission loading
 *   - Two react-hook-form instances (detailsForm, otpForm)
 *   - OTP timer (cooldown before resend)
 *   - All handler functions (sendOtp, resendOtp, verifyOtp)
 *   - "Change details" navigation (go back to step 1)
 *
 * WHAT THE UI COMPONENT DOES:
 *   - Calls useRegisterForm()
 *   - Renders JSX using the hook's return values
 *   - NOTHING else
 */

import { useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useOtpTimer } from "@/features/auth/hooks/use-otp-timer";
import { useRegisterHandlers } from "@/features/auth/logic/register-handlers";
import {
  registerDetailsSchema,
  registerOtpSchema,
} from "@/features/auth/logic/auth-schemas";
import type {
  RegisterDetailsForm,
  RegisterOtpForm,
  RegisterSuccessData,
} from "@/features/auth/logic/auth-schemas";

/** Props accepted by the hook (same as RegisterFormProps) */
interface UseRegisterFormOptions {
  /** Called when registration succeeds — receives user + token data */
  onSuccess?: (data: RegisterSuccessData) => void;
  /** Called when user clicks "Login" — navigates to login page */
  onSwitchToLogin?: () => void;
  /** Mobile number pre-filled from the login page (via URL ?mobile=) */
  prefilledMobile?: string;
}

/** Return type of useRegisterForm — everything the UI needs */
export interface RegisterFormState {
  // ── Step state ──
  step: "details" | "otp";
  isSubmitting: boolean;
  devOtp: string | null;
  nameValue: string;
  watchedMobile: string;

  // ── Form instances ──
  detailsForm: ReturnType<typeof useForm<RegisterDetailsForm>>;
  otpForm: ReturnType<typeof useForm<RegisterOtpForm>>;

  // ── OTP timer ──
  otpTimer: {
    isRunning: boolean;
    secondsLeft: number;
    canResend: boolean;
    start: () => void;
  };

  // ── Handlers ──
  handleSendOtp: (data: RegisterDetailsForm) => Promise<void>;
  handleResendOtp: () => Promise<void>;
  handleVerifyOtp: (data: RegisterOtpForm) => Promise<void>;
  handleChangeDetails: () => void;
}

export function useRegisterForm(options: UseRegisterFormOptions): RegisterFormState {
  const { onSuccess, prefilledMobile } = options;

  // ── API handler layer (pure logic, returns structured results) ──
  const handlers = useRegisterHandlers();

  // ── OTP timer (30s cooldown between resend attempts) ──
  const otpTimer = useOtpTimer(30);

  // ── Local UI state ──
  const [step, setStep] = useState<"details" | "otp">("details");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [devOtp, setDevOtp] = useState<string | null>(null);

  // ── Form instances (react-hook-form + Zod validation) ──
  const detailsForm = useForm<RegisterDetailsForm>({
    resolver: zodResolver(registerDetailsSchema),
    defaultValues: { name: "", mobile: prefilledMobile || "" },
    mode: "onChange",
  });

  const otpForm = useForm<RegisterOtpForm>({
    resolver: zodResolver(registerOtpSchema),
    defaultValues: { mobile: "", otp: "" },
    mode: "onChange",
  });

  /** Watch values for the "details summary" section in OTP step */
  const watchedMobile = detailsForm.watch("mobile");
  const nameValue = detailsForm.watch("name");

  /**
   * Send OTP after user fills in name + mobile.
   *
   * FLOW:
   *   1. Set loading state
   *   2. Call API via handlers.sendOtp() with purpose="REGISTER"
   *   3. On success: move to OTP step, copy mobile to otpForm, start timer
   *   4. On "mobile exists" error: show toast (handled by handler)
   *   5. In dev mode: display the OTP on screen for testing
   */
  const handleSendOtp = useCallback(async (data: RegisterDetailsForm) => {
    setIsSubmitting(true);

    const res = await handlers.sendOtp(data);

    if (res.success) {
      setStep("otp");
      otpForm.setValue("mobile", data.mobile);
      otpTimer.start();
    }
    if (res.devOtp) setDevOtp(res.devOtp);

    setIsSubmitting(false);
  }, [handlers, otpTimer, otpForm]);

  /**
   * Resend OTP after the cooldown timer expires.
   *
   * GUARDS:
   *   - Won't send if no mobile number is available
   *   - Won't send if the timer hasn't expired (otpTimer.canResend)
   */
  const handleResendOtp = useCallback(async () => {
    const mobile = otpForm.getValues("mobile");
    if (!mobile || !otpTimer.canResend) return;

    setIsSubmitting(true);

    const res = await handlers.resendOtp(mobile);

    if (res.success) otpTimer.start();
    if (res.devOtp) setDevOtp(res.devOtp);

    setIsSubmitting(false);
  }, [handlers, otpTimer, otpForm]);

  /**
   * Verify the OTP and complete registration.
   *
   * FLOW:
   *   1. Get the name from detailsForm (needed for account creation)
   *   2. Call API via handlers.verifyOtp() with mobile + otp + name
   *   3. On success: calls onSuccess callback → auth store + redirect
   */
  const handleVerifyOtp = useCallback(async (data: RegisterOtpForm) => {
    setIsSubmitting(true);

    const name = detailsForm.getValues("name");
    const res = await handlers.verifyOtp(data, name);

    if (res.success && res.data) onSuccess?.(res.data);

    setIsSubmitting(false);
  }, [handlers, onSuccess, detailsForm]);

  /** Go back to the details step (user wants to change name/mobile) */
  const handleChangeDetails = useCallback(() => {
    setStep("details");
    setDevOtp(null);
    otpForm.reset();
    otpForm.setValue("otp", "");
  }, [otpForm]);

  return {
    step, isSubmitting, devOtp, nameValue, watchedMobile,
    detailsForm, otpForm,
    otpTimer,
    handleSendOtp, handleResendOtp, handleVerifyOtp, handleChangeDetails,
  };
}
