/**
 * @file Resend OTP timer — shared across login & register OTP steps
 *
 * PURPOSE:
 *   Shows either a countdown timer ("Resend in 23s") or a "Resend OTP" link
 *   depending on whether the cooldown timer is still running.
 *
 * WHY NEEDED?
 *   Without a cooldown, users could spam "Resend OTP" and trigger
 *   rate-limit errors or SMS cost spikes. The timer enforces a 30s gap.
 *
 * BEHAVIOR:
 *   - While timer is running: shows animated clock icon + countdown seconds
 *   - When timer finishes: shows clickable "Resend OTP" link
 *   - "Resend OTP" is disabled while form is submitting
 */

import { Timer } from "lucide-react";

interface ResendTimerProps {
  /** Timer state from useOtpTimer hook */
  timer: {
    isRunning: boolean;
    secondsLeft: number;
    canResend: boolean;
  };
  /** Called when user clicks "Resend OTP" */
  onResend: () => void;
  /** Whether the resend button should be disabled (form submitting) */
  disabled: boolean;
  /** Translation function */
  t: (key: string) => string;
}

export function ResendTimer({ timer, onResend, disabled, t }: ResendTimerProps) {
  if (timer.isRunning) {
    return (
      <div className="text-center pt-1">
        <p className="text-sm text-muted-foreground flex items-center justify-center gap-1.5">
          <Timer className="h-3.5 w-3.5 animate-pulse" />
          {t("auth.resendIn")}{" "}
          <span className="font-semibold text-foreground tabular-nums">
            {timer.secondsLeft}s
          </span>
        </p>
      </div>
    );
  }

  return (
    <div className="text-center pt-1">
      <button
        type="button"
        className="text-sm text-primary font-medium hover:underline"
        onClick={onResend}
        disabled={disabled}
      >
        {t("auth.resendOtp")}
      </button>
    </div>
  );
}
