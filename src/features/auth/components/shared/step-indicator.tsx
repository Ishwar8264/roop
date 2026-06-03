/**
 * @file Step indicator — register form's 2-step progress display
 *
 * PURPOSE: Visual progress for the 2-step registration flow.
 * Step 1: "Details" → Step 2: "Verify OTP"
 */

import { CheckCircle2 } from "lucide-react";

interface StepIndicatorProps {
  step: "details" | "otp";
  t: (key: string) => string;
}

export function StepIndicator({ step, t }: StepIndicatorProps) {
  return (
    <div className="flex items-center justify-center gap-0 mb-7">
      <div className="flex items-center gap-2">
        <div className={`flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold transition-all duration-300 ${
          step === "details"
            ? "bg-gradient-to-br from-rose-500 to-pink-500 text-white shadow-md shadow-rose-500/30"
            : "bg-green-500 text-white shadow-md shadow-green-500/20"
        }`}>
          {step === "otp" ? <CheckCircle2 className="h-4 w-4" /> : "1"}
        </div>
        <span className={`text-xs font-medium ${step === "details" ? "text-rose-500" : "text-green-600 dark:text-green-400"}`}>
          {t("auth.yourDetails")}
        </span>
      </div>
      <div className={`w-10 h-0.5 mx-2 rounded-full transition-colors duration-300 ${step === "otp" ? "bg-green-400" : "bg-zinc-200 dark:bg-zinc-700"}`} />
      <div className="flex items-center gap-2">
        <div className={`flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold transition-all duration-300 ${
          step === "otp"
            ? "bg-gradient-to-br from-rose-500 to-pink-500 text-white shadow-md shadow-rose-500/30"
            : "bg-zinc-200 dark:bg-zinc-700 text-zinc-400"
        }`}>2</div>
        <span className={`text-xs font-medium ${step === "otp" ? "text-rose-500" : "text-zinc-400"}`}>
          {t("auth.verifyOtp")}
        </span>
      </div>
    </div>
  );
}
