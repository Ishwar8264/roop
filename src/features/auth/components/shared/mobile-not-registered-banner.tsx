/**
 * @file Mobile-not-registered error banner — login form specific
 *
 * PURPOSE: When a user tries to login with an unregistered mobile number,
 * this banner shows the error and offers a "Register First" link.
 */

import { AlertCircle } from "lucide-react";

interface MobileNotRegisteredBannerProps {
  message: string;
  mobile: string;
  onRegister?: (mobile?: string) => void;
  t: (key: string) => string;
}

export function MobileNotRegisteredBanner({ message, mobile, onRegister, t }: MobileNotRegisteredBannerProps) {
  return (
    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-3 flex items-start gap-2.5 mb-5">
      <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
      <div className="flex-1">
        <p className="text-sm font-medium text-red-700 dark:text-red-300">{t("auth.mobileNotRegistered")}</p>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">{message}</p>
        <button
          type="button"
          className="text-xs text-rose-500 font-medium hover:underline mt-1"
          onClick={() => onRegister?.(mobile)}
        >
          {t("auth.registerFirst")} →
        </button>
      </div>
    </div>
  );
}
