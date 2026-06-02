/**
 * Purpose: useTranslation hook for accessing translations
 * Responsibility: Provide typed translation function based on current locale
 * Important Notes:
 *   - Reads locale from useLocaleStore (Zustand + localStorage)
 *   - Returns t() function that accepts dot-notation keys
 *   - SSR-safe — returns English on server
 *   - Falls back to English if key not found in Hindi
 */

"use client";

import { useLocaleStore } from "./locale-store";
import { translations } from "./translations";

type NestedObject = { [key: string]: string | NestedObject };

function getNestedValue(obj: NestedObject, path: string): string | undefined {
  const keys = path.split(".");
  let current: string | NestedObject = obj;
  for (const key of keys) {
    if (typeof current === "object" && current !== null && key in current) {
      current = current[key as keyof typeof current];
    } else {
      return undefined;
    }
  }
  return typeof current === "string" ? current : undefined;
}

export function useTranslation() {
  const locale = useLocaleStore((s) => s.locale);
  const setLocale = useLocaleStore((s) => s.setLocale);

  const dict = translations[locale];
  const fallbackDict = translations.en;

  function t(key: string, params?: Record<string, string | number>): string {
    let value = getNestedValue(dict as unknown as NestedObject, key);
    if (!value) {
      // Fallback to English
      value = getNestedValue(fallbackDict as unknown as NestedObject, key);
    }
    const result = value || key;

    // Replace {param} placeholders with actual values
    if (params) {
      return result.replace(/\{(\w+)\}/g, (_, k) => String(params[k] ?? `{${k}}`));
    }
    return result;
  }

  return {
    t,
    locale,
    setLocale,
    isHindi: locale === "hi",
    isEnglish: locale === "en",
    toggleLocale: () => setLocale(locale === "en" ? "hi" : "en"),
  };
}
