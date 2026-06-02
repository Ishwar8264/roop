/**
 * Purpose: Language toggle for switching between EN/HI
 * Responsibility: Show a compact button that toggles locale
 * Important Notes:
 *   - Shows "HI" or "EN" based on current locale
 *   - Click toggles between English and Hindi
 *   - SSR-safe — uses useLocaleStore (Zustand + localStorage)
 *   - Compact design for navbar
 */

"use client";

import { useEffect, useState } from "react";
import { Languages } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLocaleStore, type Locale } from "@/i18n/locale-store";

export function LanguageToggle() {
  const { locale, setLocale } = useLocaleStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" className="h-9 w-9">
        <Languages className="h-4 w-4" />
        <span className="sr-only">Switch Language</span>
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-9 px-2 gap-1.5 text-xs font-bold">
          <Languages className="h-3.5 w-3.5" />
          {locale === "en" ? "EN" : "HI"}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onClick={() => setLocale("en")}
          className={locale === "en" ? "bg-accent" : ""}
        >
          🇬🇧 English
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setLocale("hi")}
          className={locale === "hi" ? "bg-accent" : ""}
        >
          🇮🇳 हिन्दी
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
