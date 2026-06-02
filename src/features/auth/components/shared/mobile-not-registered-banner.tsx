/**
 * @file Mobile-not-registered error banner — login form specific
 *
 * PURPOSE:
 *   When a user tries to login with a mobile number that doesn't exist
 *   in the database, this banner appears explaining the situation and
 *   offering a "Register First →" link.
 *
 * WHY NOT A TOAST?
 *   A toast disappears after a few seconds. This error needs to stay
 *   visible so the user can click "Register First" at their own pace.
 *   It's an ACTIONABLE error, not just informational.
 *
 * DESIGN:
 *   - Destructive/red color scheme (matches error patterns)
 *   - AlertCircle icon for visual emphasis
 *   - Clickable "Register First →" link that carries the mobile number
 *     to the registration page (so user doesn't have to retype it)
 */

import { AlertCircle } from "lucide-react";

interface MobileNotRegisteredBannerProps {
  /** Error message from the API */
  message: string;
  /** The mobile number the user tried (passed to register page) */
  mobile: string;
  /** Navigate to register page with the mobile number */
  onRegister?: (mobile?: string) => void;
  /** Translation function */
  t: (key: string) => string;
}

export function MobileNotRegisteredBanner({
  message, mobile, onRegister, t,
}: MobileNotRegisteredBannerProps) {
  return (
    <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-3 flex items-start gap-2.5 mb-4">
      <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
      <div className="flex-1">
        <p className="text-sm font-medium text-destructive">
          {t("auth.mobileNotRegistered")}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">{message}</p>
        <button
          type="button"
          className="text-xs text-primary font-medium hover:underline mt-1"
          onClick={() => onRegister?.(mobile)}
        >
          {t("auth.registerFirst")} →
        </button>
      </div>
    </div>
  );
}
