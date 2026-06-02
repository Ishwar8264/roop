/**
 * Purpose: Language/locale store for EN/HI switching
 * Responsibility: Manage current locale, persist to localStorage
 * Important Notes:
 *   - Default locale: "en" (English)
 *   - Persisted to localStorage under "nr-locale"
 *   - Used by useTranslation hook and all UI components
 *   - SSR-safe — returns "en" on server
 */

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export type Locale = "en" | "hi";

interface LocaleState {
  locale: Locale;
  setLocale: (locale: Locale) => void;
}

export const useLocaleStore = create<LocaleState>()(
  persist(
    (set) => ({
      locale: "en",
      setLocale: (locale: Locale) => set({ locale }),
    }),
    {
      name: "nr-locale",
      storage: createJSONStorage(() => {
        if (typeof window !== "undefined") {
          return localStorage;
        }
        return {
          getItem: () => null,
          setItem: () => {},
          removeItem: () => {},
        };
      }),
    }
  )
);
