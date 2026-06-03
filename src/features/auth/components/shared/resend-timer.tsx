/**
 * @file Resend OTP timer — shared across login & register OTP steps
 *
 * PURPOSE: Shows countdown timer or "Resend OTP" link based on cooldown state.
 */

import { Timer } from "lucide-react";

interface ResendTimerProps {
  timer: { isRunning: boolean; secondsLeft: number; canResend: boolean };
  onResend: () => void;
  disabled: boolean;
  t: (key: string) => string;
}

export function ResendTimer({ timer, onResend, disabled, t }: ResendTimerProps) {
  if (timer.isRunning) {
    return (
      <div className="text-center">
        <p className="text-sm text-zinc-500 dark:text-zinc-400 flex items-center justify-center gap-1.5">
          <Timer className="h-3.5 w-3.5 animate-pulse" />
          {t("auth.resendIn")}{" "}
          <span className="font-semibold text-zinc-900 dark:text-zinc-100 tabular-nums">{timer.secondsLeft}s</span>
        </p>
      </div>
    );
  }

  return (
    <div className="text-center">
      <button
        type="button"
        className="text-sm text-rose-500 font-medium hover:underline disabled:opacity-50"
        onClick={onResend}
        disabled={disabled}
      >
        {t("auth.resendOtp")}
      </button>
    </div>
  );
}
