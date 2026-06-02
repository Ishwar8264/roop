/**
 * @file Step indicator — register form's 2-step progress display
 *
 * PURPOSE:
 *   Shows a visual progress indicator for the 2-step registration flow:
 *   Step 1: "Your Details" → Step 2: "Verify OTP"
 *
 * DESIGN:
 *   - Completed step: green circle with CheckCircle2 icon
 *   - Active step: gradient circle (rose→pink) with number
 *   - Future step: muted circle with number
 *   - Connecting line between steps turns green when step 1 is complete
 *   - Smooth 300ms transitions on all state changes
 */

import { CheckCircle2 } from "lucide-react";

interface StepIndicatorProps {
  /** Current step in the registration flow */
  step: "details" | "otp";
  /** Translation function */
  t: (key: string) => string;
}

export function StepIndicator({ step, t }: StepIndicatorProps) {
  return (
    <div className="flex items-center justify-center gap-0 mb-6">
      {/* Step 1: Your Details */}
      <div className="flex items-center gap-2">
        <div
          className={`flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold transition-all duration-300 ${
            step === "details"
              ? "bg-gradient-to-br from-rose-500 to-pink-500 text-white shadow-md shadow-rose-500/30"
              : "bg-green-500 text-white shadow-md shadow-green-500/20"
          }`}
        >
          {step === "otp" ? <CheckCircle2 className="h-4 w-4" /> : "1"}
        </div>
        <span
          className={`text-xs font-medium ${
            step === "details"
              ? "text-primary"
              : "text-green-600 dark:text-green-400"
          }`}
        >
          {t("auth.yourDetails")}
        </span>
      </div>

      {/* Connecting line */}
      <div
        className={`w-10 h-0.5 mx-2 rounded-full transition-colors duration-300 ${
          step === "otp" ? "bg-green-400" : "bg-muted"
        }`}
      />

      {/* Step 2: Verify OTP */}
      <div className="flex items-center gap-2">
        <div
          className={`flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold transition-all duration-300 ${
            step === "otp"
              ? "bg-gradient-to-br from-rose-500 to-pink-500 text-white shadow-md shadow-rose-500/30"
              : "bg-muted text-muted-foreground"
          }`}
        >
          2
        </div>
        <span
          className={`text-xs font-medium ${
            step === "otp" ? "text-primary" : "text-muted-foreground"
          }`}
        >
          {t("auth.verifyOtp")}
        </span>
      </div>
    </div>
  );
}
