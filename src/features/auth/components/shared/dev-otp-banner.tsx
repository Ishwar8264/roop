/**
 * @file Dev OTP banner — shows OTP in development mode
 *
 * PURPOSE: Display the OTP value returned by the API during development
 * so the developer can test the OTP flow without receiving an actual SMS.
 */

interface DevOtpBannerProps {
  devOtp: string;
  t: (key: string) => string;
}

export function DevOtpBanner({ devOtp, t }: DevOtpBannerProps) {
  return (
    <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-3 text-center mb-5">
      <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
        {t("auth.devOtp")}:{" "}
        <span className="font-bold text-lg tracking-widest">{devOtp}</span>
      </p>
    </div>
  );
}
