/**
 * @file Details summary — shows entered name & mobile in register OTP step
 *
 * PURPOSE:
 *   After the user enters their name and mobile in step 1 and moves to
 *   the OTP verification step, this component displays what they entered
 *   so they can verify the details are correct.
 *
 * WHY SHOW THIS?
 *   - User might have typed the wrong mobile number
 *   - Without this summary, they'd have to go back to check
 *   - Provides a "Change Details" link to go back to step 1
 *
 * DESIGN:
 *   - Rose-to-pink gradient background (matches salon theme)
 *   - Dark mode compatible (rose-950/20 background)
 *   - "Change Details" link lets user go back and fix mistakes
 */

interface DetailsSummaryProps {
  /** User's full name from step 1 */
  name: string;
  /** User's email from step 1 */
  email: string;
  /** User's mobile number from step 1 */
  mobile: string;
  /** Navigate back to step 1 to edit details */
  onChangeDetails: () => void;
  /** Translation function */
  t: (key: string) => string;
}

export function DetailsSummary({ name, email, mobile, onChangeDetails, t }: DetailsSummaryProps) {
  return (
    <div className="bg-gradient-to-r from-rose-50 to-pink-50 dark:from-rose-950/20 dark:to-pink-950/20 rounded-xl p-4 space-y-2 border border-rose-100 dark:border-rose-900/30">
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">{t("auth.name")}:</span>
        <span className="font-semibold text-foreground">{name}</span>
      </div>
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">{t("auth.email")}:</span>
        <span className="font-semibold text-foreground">{email}</span>
      </div>
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">{t("auth.mobileNumber")}:</span>
        <span className="font-semibold text-foreground">{mobile}</span>
      </div>
      <button
        type="button"
        className="text-xs text-primary font-medium hover:underline"
        onClick={onChangeDetails}
      >
        {t("auth.changeDetails")}
      </button>
    </div>
  );
}
