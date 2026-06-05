/**
 * Purpose: Public navbar for unauthenticated users (landing page)
 * Responsibility: Show navigation + Sign In / Sign Up buttons for visitors
 * Important Notes:
 *   - Only visible on landing page (/)
 *   - Desktop: brand left | nav center | Language + Theme + Sign In/Up right
 *   - Mobile: hamburger + brand + Sign In button
 *   - Uses shared nav-config for public routes
 *   - Sticky top with backdrop blur
 */

"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Menu, LogIn, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from "@/components/ui/sheet";
import { ThemeToggle } from "./theme-toggle";
import { LanguageToggle } from "./language-toggle";
import { useTranslation } from "@/i18n/use-translation";
import { useAuthStore } from "@/stores/auth-store";
import { useSyncExternalStore } from "react";

/** Subscribe to nothing — just detect client mount via useSyncExternalStore */
const emptySubscribe = () => () => {};
function useMounted() {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,  // client snapshot
    () => false  // server snapshot
  );
}

// ==================== Public Nav Items ====================

const publicNavItems = [
  { href: "/#services", labelKey: "nav.services" },
  { href: "/#features", labelKey: "nav.offers" },
  { href: "/#offer", labelKey: "nav.offers" },
  { href: "/blog", labelKey: "nav.blog" },
];

// ==================== Component ====================

export function PublicHeader() {
  const router = useRouter();
  const { t } = useTranslation();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const mounted = useMounted();

  // If authenticated, don't show public header (AuthProvider will redirect to dashboard)
  if (isAuthenticated) return null;

  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-6xl mx-auto px-4">
        {/* ===== Mobile Header (< lg) ===== */}
        <div className="flex lg:hidden items-center justify-between h-14">
          <MobileMenu />

          <Link href="/" className="flex items-center gap-2">
            <Image src="/logo.png" alt="Nikharta Roop" width={32} height={32} className="h-8 w-8 rounded-lg object-contain" />
            <span className="font-bold text-primary text-lg">{t("appNameHi")}</span>
          </Link>

          <div className="flex items-center gap-1">
            <LanguageToggle />
            <ThemeToggle />
            {mounted && !isAuthenticated && (
              <Button
                size="sm"
                className="h-8 px-3 bg-primary hover:bg-primary/90 text-primary-foreground text-xs"
                onClick={() => router.push("/login")}
              >
                <LogIn className="h-3.5 w-3.5 mr-1" />
                {t("auth.login")}
              </Button>
            )}
          </div>
        </div>

        {/* ===== Desktop Header (>= lg) — Brand | CENTERED Nav | Actions ===== */}
        <div className="hidden lg:flex items-center h-16">
          {/* Brand */}
          <div className="flex-shrink-0">
            <Link href="/" className="flex items-center gap-2.5">
              <Image src="/logo.png" alt="Nikharta Roop" width={36} height={36} className="h-9 w-9 rounded-lg object-contain" />
              <span className="font-bold text-primary text-xl">{t("appNameHi")}</span>
            </Link>
          </div>

          {/* Centered Nav */}
          <nav className="flex-1 flex items-center justify-center gap-1" aria-label="Public navigation">
            {publicNavItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors duration-200"
              >
                <span>{t(item.labelKey)}</span>
              </Link>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex-shrink-0 flex items-center gap-2">
            <LanguageToggle />
            <ThemeToggle />
            {mounted && !isAuthenticated && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-primary"
                  onClick={() => router.push("/login")}
                >
                  <LogIn className="h-4 w-4 mr-1.5" />
                  {t("auth.login")}
                </Button>
                <Button
                  size="sm"
                  className="bg-primary hover:bg-primary/90 text-primary-foreground"
                  onClick={() => router.push("/register")}
                >
                  <UserPlus className="h-4 w-4 mr-1.5" />
                  {t("auth.register")}
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

// ==================== Mobile Menu ====================

function MobileMenu() {
  const { t } = useTranslation();
  const router = useRouter();

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="h-9 w-9">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72 p-0">
        <SheetTitle className="px-4 pt-4 pb-2 border-b flex items-center gap-2">
          <Image src="/logo.png" alt="Nikharta Roop" width={28} height={28} className="h-7 w-7 rounded-lg object-contain" />
          <span className="text-primary font-bold text-lg">{t("appNameHi")}</span>
        </SheetTitle>
        <nav className="flex flex-col p-2">
          {publicNavItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center px-3 py-2.5 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors"
            >
              {t(item.labelKey)}
            </Link>
          ))}
        </nav>
        <div className="border-t p-4 space-y-2">
          <div className="flex items-center gap-2 mb-3">
            <LanguageToggle />
            <ThemeToggle />
          </div>
          <Button
            variant="outline"
            className="w-full border-primary/30 text-primary"
            onClick={() => router.push("/login")}
          >
            <LogIn className="h-4 w-4 mr-2" />
            {t("auth.login")}
          </Button>
          <Button
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
            onClick={() => router.push("/register")}
          >
            <UserPlus className="h-4 w-4 mr-2" />
            {t("auth.register")}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
