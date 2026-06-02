/**
 * @file Dev OTP banner — shows OTP in development mode
 *
 * PURPOSE:
 *   During development, the backend returns the OTP in the API response
 *   instead of actually sending an SMS. This banner displays it so the
 *   developer can copy-paste it into the OTP input for testing.
 *
 * WHY CONDITIONAL?
 *   The `devOtp` value is only set when the API returns it (dev mode).
 *   In production, the API never returns the OTP, so this banner never renders.
 *
 * DESIGN:
 *   - Amber/warning color scheme to make it obvious this is NOT for production
 *   - Dark mode compatible (amber-900/20 background)
 *   - Large tracking-wider OTP text for easy reading
 */

interface DevOtpBannerProps {
  /** The OTP value to display (only set in dev mode) */
  devOtp: string;
  /** Translation function — t("auth.devOtp") for the label */
  t: (key: string) => string;
}

export function DevOtpBanner({ devOtp, t }: DevOtpBannerProps) {
  return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-center mb-4 dark:bg-amber-900/20 dark:border-amber-800">
      <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
        {t("auth.devOtp")}:{" "}
        <span className="font-bold text-lg tracking-wider">{devOtp}</span>
      </p>
    </div>
  );
}
