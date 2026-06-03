/**
 * @file Details summary — shows entered name & mobile in register OTP step
 *
 * PURPOSE: Display what the user entered in step 1 so they can verify
 * before submitting the OTP. Provides "Change Details" link.
 */

interface DetailsSummaryProps {
  name: string;
  mobile: string;
  onChangeDetails: () => void;
  t: (key: string) => string;
}

export function DetailsSummary({ name, mobile, onChangeDetails, t }: DetailsSummaryProps) {
  return (
    <div className="bg-gradient-to-r from-rose-50 to-pink-50 dark:from-rose-950/20 dark:to-pink-950/20 rounded-xl p-4 space-y-2 border border-rose-100 dark:border-rose-900/30">
      <div className="flex justify-between text-sm">
        <span className="text-zinc-500 dark:text-zinc-400">{t("auth.name")}:</span>
        <span className="font-semibold text-zinc-900 dark:text-zinc-100">{name}</span>
      </div>
      <div className="flex justify-between text-sm">
        <span className="text-zinc-500 dark:text-zinc-400">{t("auth.mobileNumber")}:</span>
        <span className="font-semibold text-zinc-900 dark:text-zinc-100">{mobile}</span>
      </div>
      <button type="button" className="text-xs text-rose-500 font-medium hover:underline" onClick={onChangeDetails}>
        {t("auth.changeDetails")}
      </button>
    </div>
  );
}
