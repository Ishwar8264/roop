/**
 * Purpose: Theme provider wrapping next-themes for dark/light/system mode
 * Responsibility: Provide theme context to the entire app
 * Important Notes:
 *   - Must be "use client" — uses browser APIs
 *   - Wraps next-themes ThemeProvider with sensible defaults
 *   - Default theme: "system" (follows OS preference)
 *   - Storage key: "nr-theme" (persisted in localStorage)
 *   - enableSystem: true — adds system as an option
 *   - disableTransitionOnChange: true — prevents flicker on theme switch
 */

"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import type { ReactNode } from "react";

interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
      storageKey="nr-theme"
    >
      {children}
    </NextThemesProvider>
  );
}
