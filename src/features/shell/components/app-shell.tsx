/**
 * Purpose: App layout shell — composes header + content + bottom navigation
 * Responsibility: Provide consistent layout for all authenticated app pages
 * Important Notes:
 *   - Client component — needs to detect screen size
 *   - Mobile/Tablet: AppHeader (thin) + content + BottomNav (fixed)
 *   - Desktop: AppHeader (full) + content, no BottomNav
 *   - Content gets bottom padding on mobile to account for fixed BottomNav
 */

"use client";

import type { ReactNode } from "react";
import { AppHeader } from "./app-header";
import { BottomNav } from "./bottom-nav";

// ==================== Component ====================

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <AppHeader />

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-6">
        {children}
      </main>

      {/* Bottom nav — mobile/tablet only */}
      <div className="md:hidden">
        <BottomNav />
      </div>

      {/* Spacer for fixed bottom nav on mobile */}
      <div className="h-16 md:h-0" />
    </div>
  );
}
