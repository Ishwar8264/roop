/**
 * @file Tab switcher — login form's OTP vs Email toggle
 *
 * PURPOSE:
 *   Renders a segmented-control style toggle between "Mobile OTP" and "Email"
 *   login methods. The active tab gets a sliding gradient pill background.
 *
 * WHY A SEPARATE COMPONENT?
 *   The tab switcher has complex animation logic (sliding pill position,
 *   transition timing, color changes). Extracting it keeps the login form
 *   clean and makes the switcher independently testable.
 *
 * DESIGN:
 *   - Sliding gradient pill (rose→pink) that moves left/right on tab change
 *   - 300ms ease-out transition for smooth pill slide
 *   - Active tab text is white (on gradient), inactive is muted
 *   - Switching to OTP tab resets the OTP flow (clears sent state)
 */

import { Phone, Mail } from "lucide-react";

interface TabSwitcherProps {
  /** Currently active tab */
  tab: "otp" | "email";
  /** Change the active tab */
  setTab: (tab: "otp" | "email") => void;
  /** Reset OTP flow when switching back to OTP tab */
  resetOtp: () => void;
  /** Translation function */
  t: (key: string) => string;
}

export function TabSwitcher({ tab, setTab, resetOtp, t }: TabSwitcherProps) {
  return (
    <div className="relative flex bg-muted/50 rounded-xl p-1 mb-6">
      {/* Sliding gradient pill background */}
      <div
        className={`absolute top-1 bottom-1 rounded-lg bg-gradient-to-r from-rose-500 to-pink-500 shadow-md shadow-rose-500/25 transition-all duration-300 ease-out ${
          tab === "otp"
            ? "left-1 w-[calc(50%-4px)]"
            : "left-[calc(50%+2px)] w-[calc(50%-4px)]"
        }`}
      />

      {/* OTP tab button */}
      <button
        type="button"
        onClick={() => { setTab("otp"); resetOtp(); }}
        className={`relative z-10 flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium transition-colors duration-300 ${
          tab === "otp" ? "text-white" : "text-muted-foreground hover:text-foreground"
        }`}
      >
        <Phone className="h-4 w-4" />
        {t("auth.mobileOtp")}
      </button>

      {/* Email tab button */}
      <button
        type="button"
        onClick={() => setTab("email")}
        className={`relative z-10 flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium transition-colors duration-300 ${
          tab === "email" ? "text-white" : "text-muted-foreground hover:text-foreground"
        }`}
      >
        <Mail className="h-4 w-4" />
        {t("auth.email")}
      </button>
    </div>
  );
}
