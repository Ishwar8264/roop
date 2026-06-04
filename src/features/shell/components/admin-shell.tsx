/**
 * Purpose: Admin layout shell — composes sidebar + top header + content
 * Responsibility: Provide consistent layout for all admin pages
 * Important Notes:
 *   - Client component — handles sidebar state + role check
 *   - Desktop: Collapsible sidebar + top header + content
 *   - Mobile: Top header (with menu trigger) + Sheet sidebar + content
 *   - Redirects to /dashboard if user is not ADMIN
 */

"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { GuardedLink } from "@/components/ui/guarded-link";
import { ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTitle,
} from "@/components/ui/sheet";
import { ThemeToggle } from "@/features/shell/components/theme-toggle";
import { LanguageToggle } from "@/features/shell/components/language-toggle";
import { useAuthStore } from "@/stores/auth-store";
import { useTranslation } from "@/i18n/use-translation";
import {
  AdminDesktopSidebar,
  AdminMobileSidebarContent,
} from "./admin-sidebar";

// ==================== Component ====================

interface AdminShellProps {
  children: ReactNode;
}

export function AdminShell({ children }: AdminShellProps) {
  const { user, isAuthenticated } = useAuthStore();
  const { t } = useTranslation();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Not authenticated — show access denied
  if (!isAuthenticated || !user) {
    return <AccessDenied message={t("admin.loginRequired")} />;
  }

  // Not admin — show access denied
  if (user.role !== "ADMIN") {
    return <AccessDenied message={t("admin.adminOnly")} />;
  }

  return (
    <div className="min-h-screen flex bg-background">
      {/* Desktop Sidebar */}
      <AdminDesktopSidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />

      {/* Mobile Sidebar Sheet */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-72 p-0">
          <SheetTitle className="sr-only">Admin Navigation</SheetTitle>
          <AdminMobileSidebarContent onItemClick={() => setMobileOpen(false)} />
        </SheetContent>
      </Sheet>

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Admin top header */}
        <header className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex items-center h-14 px-4">
            {/* Mobile menu trigger */}
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 lg:hidden mr-2"
              onClick={() => setMobileOpen(true)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/></svg>
              <span className="sr-only">Admin Menu</span>
            </Button>

            {/* Brand — mobile only */}
            <GuardedLink href="/admin/dashboard" className="flex items-center gap-2 lg:hidden">
              <img src="/logo.png" alt="Nikharta Roop" className="h-7 w-7 rounded-lg object-contain" />
              <span className="font-bold text-primary">{t("appNameHi")}</span>
            </GuardedLink>

            {/* Spacer */}
            <div className="flex-1" />

            {/* Admin badge */}
            <span className="hidden sm:inline-flex items-center gap-1.5 text-xs font-medium bg-primary/10 text-primary px-2.5 py-1 rounded-full mr-3">
              <ShieldAlert className="h-3.5 w-3.5" />
              {t("admin.badge")}
            </span>

            {/* Controls */}
            <div className="flex items-center gap-1">
              <LanguageToggle />
              <ThemeToggle />
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}

// ==================== Access Denied ====================

function AccessDenied({ message }: { message: string }) {
  const router = useRouter();
  const { t } = useTranslation();

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4 px-4">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-destructive/10 text-destructive">
          <ShieldAlert className="h-10 w-10" />
        </div>
        <h1 className="text-2xl font-bold">{t("admin.accessDenied")}</h1>
        <p className="text-muted-foreground max-w-md">{message}</p>
        <Button onClick={() => router.push("/dashboard")} className="bg-primary hover:bg-primary/90 text-primary-foreground">
          {t("admin.backToApp")}
        </Button>
      </div>
    </div>
  );
}
