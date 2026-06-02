/**
 * Purpose: Responsive top header for the app
 * Responsibility: Render mobile thin header and desktop full navbar
 * Important Notes:
 *   - Mobile (< lg): thin header with hamburger menu + brand + controls
 *   - Desktop (>= lg): full header with brand | CENTERED nav links | controls
 *   - Centered nav: brand left, nav center, controls right
 *   - Controls: LanguageToggle + ThemeToggle + UserMenu
 *   - Sticky top with backdrop blur
 *   - Uses shared nav-config for items
 */

"use client";

import Link from "next/link";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from "@/components/ui/sheet";
import { NavLink, type NavItem } from "./nav-link";
import { UserMenu } from "./user-menu";
import { ThemeToggle } from "./theme-toggle";
import { LanguageToggle } from "./language-toggle";
import { useTranslation } from "@/i18n/use-translation";
import { allNavItems } from "./nav-config";

// ==================== Component ====================

export function AppHeader() {
  const { t } = useTranslation();

  // Build nav items with translated labels
  const navItems: NavItem[] = allNavItems.map((item) => ({
    href: item.href,
    icon: item.icon,
    label: t(item.labelKey),
    iconName: item.iconName,
  }));

  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-6xl mx-auto px-4">
        {/* ===== Mobile Header (< lg) ===== */}
        <div className="flex lg:hidden items-center justify-between h-14">
          <MobileMenuButton navItems={navItems} />

          <Link href="/dashboard" className="font-bold text-primary text-lg">
            {t("appNameHi")}
          </Link>

          <div className="flex items-center gap-0.5">
            <LanguageToggle />
            <ThemeToggle />
            <UserMenu />
          </div>
        </div>

        {/* ===== Desktop Header (>= lg) — Brand | CENTERED Nav | Controls ===== */}
        <div className="hidden lg:flex items-center h-16">
          {/* Brand — left */}
          <div className="flex-shrink-0">
            <Link href="/dashboard" className="font-bold text-primary text-xl">
              {t("appNameHi")}
            </Link>
          </div>

          {/* Centered Nav — takes remaining space */}
          <nav className="flex-1 flex items-center justify-center gap-1" aria-label="Main navigation">
            {navItems.map((item) => (
              <NavLink key={item.href} item={item} variant="header" />
            ))}
          </nav>

          {/* Controls — right */}
          <div className="flex-shrink-0 flex items-center gap-1">
            <LanguageToggle />
            <ThemeToggle />
            <UserMenu />
          </div>
        </div>
      </div>
    </header>
  );
}

// ==================== Mobile Menu ====================

function MobileMenuButton({ navItems }: { navItems: NavItem[] }) {
  const { t } = useTranslation();

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="h-9 w-9">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72 p-0">
        <SheetTitle className="px-4 pt-4 pb-2 text-primary font-bold text-lg border-b">
          {t("appNameHi")}
        </SheetTitle>
        <nav className="flex flex-col p-2">
          {navItems.map((item) => (
            <NavLink
              key={item.href}
              item={item}
              variant="header"
              className="w-full justify-start"
            />
          ))}
        </nav>
        {/* Mobile menu extras */}
        <div className="border-t p-4 flex items-center gap-2">
          <LanguageToggle />
          <ThemeToggle />
        </div>
      </SheetContent>
    </Sheet>
  );
}
