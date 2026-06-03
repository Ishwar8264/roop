/**
 * @file Tab switcher — login form's OTP vs Email toggle
 *
 * PURPOSE: Segmented-control toggle with sliding gradient pill.
 * Active tab gets rose→pink gradient, inactive is zinc text.
 */

import { Phone, Mail } from "lucide-react";

interface TabSwitcherProps {
  tab: "otp" | "email";
  setTab: (tab: "otp" | "email") => void;
  resetOtp: () => void;
  t: (key: string) => string;
}

export function TabSwitcher({ tab, setTab, resetOtp, t }: TabSwitcherProps) {
  return (
    <div className="relative flex bg-zinc-100 dark:bg-zinc-800 rounded-xl p-1 mb-7">
      {/* Sliding gradient pill */}
      <div
        className={`absolute top-1 bottom-1 rounded-lg bg-gradient-to-r from-rose-500 to-pink-500 shadow-md shadow-rose-500/25 transition-all duration-300 ease-out ${
          tab === "otp"
            ? "left-1 w-[calc(50%-4px)]"
            : "left-[calc(50%+2px)] w-[calc(50%-4px)]"
        }`}
      />
      <button
        type="button"
        onClick={() => { setTab("otp"); resetOtp(); }}
        className={`relative z-10 flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium transition-colors duration-300 ${
          tab === "otp" ? "text-white" : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300"
        }`}
      >
        <Phone className="h-4 w-4" />{t("auth.mobileOtp")}
      </button>
      <button
        type="button"
        onClick={() => setTab("email")}
        className={`relative z-10 flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium transition-colors duration-300 ${
          tab === "email" ? "text-white" : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300"
        }`}
      >
        <Mail className="h-4 w-4" />{t("auth.email")}
      </button>
    </div>
  );
}
