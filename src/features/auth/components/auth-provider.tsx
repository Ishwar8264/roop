/**
 * Purpose: Auth initialization provider
 * Responsibility: Initialize auth state on mount, sync Zustand with /api/auth/me
 * Important Notes:
 *   - Must be "use client" — uses useEffect, useState
 *   - Wrap this around {children} in root layout — ONE time only
 *   - On mount: syncs user state from HttpOnly cookie-backed server session
 *   - If access cookie is stale: refreshes via HttpOnly refresh cookie, then retries /api/auth/me
 *   - Shows loading screen until auth state is determined
 *   - IMPORTANT: Loading screen has timeout (5s) to avoid blocking if API is down
 *   - Route protection is PRIMARILY handled by src/proxy.ts (server-side)
 *   - This component ALSO handles client-side redirects as a FALLBACK for when
 *     proxy.ts cookies aren't available (e.g., fetch() Set-Cookie not processed yet)
 */

"use client";

import { useState, useEffect, useCallback, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { useAuthStore } from "@/stores/auth-store";
import type { ApiResponse } from "@/types";
import type { UserProfile } from "@/types";

// ==================== Auth Pages ====================

const AUTH_PAGES = ["/login", "/register", "/auth/callback"];

function isAuthPage(pathname: string): boolean {
  return AUTH_PAGES.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );
}

// ==================== Auth Provider ====================

export function AuthProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [isReady, setIsReady] = useState(false);

  // Subscribe to isAuthenticated for the redirect effect
  // Using the hook (not getState()) so React re-renders when it changes
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  // Initialize auth state on mount — sync Zustand with backend cookies
  const initAuth = useCallback(async (signal: AbortSignal) => {
    async function fetchCurrentUser(): Promise<UserProfile | null> {
      const response = await fetch("/api/auth/me", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        signal,
      });

      if (!response.ok) return null;

      const res: ApiResponse<{ user: UserProfile }> = await response.json();
      return res.success ? res.data?.user ?? null : null;
    }

    try {
      let user = await fetchCurrentUser();

      if (!user && !signal.aborted) {
        const refreshResponse = await fetch("/api/auth/refresh", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
          credentials: "same-origin",
          signal,
        });

        if (refreshResponse.ok) {
          user = await fetchCurrentUser();
        }
      }

      if (!signal.aborted) {
        if (user) {
          useAuthStore.getState().login(user);
        } else {
          useAuthStore.getState().logout();
        }
      }
    } catch {
      if (!signal.aborted) {
        useAuthStore.getState().logout();
      }
    } finally {
      if (!signal.aborted) {
        setIsReady(true);
      }
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    initAuth(controller.signal);

    // Safety timeout — don't block UI forever if API is slow
    const timeout = setTimeout(() => {
      if (!controller.signal.aborted) setIsReady(true);
    }, 5000);

    return () => {
      controller.abort();
      clearTimeout(timeout);
    };
  }, [initAuth]);

  // Client-side redirect fallback: if user is authenticated but stuck on auth page,
  // redirect them to dashboard. This handles the case where proxy.ts cookies
  // aren't available (e.g., fetch() Set-Cookie not processed by browser yet)
  // Uses isAuthenticated from the hook (not getState) so it re-runs on store changes
  useEffect(() => {
    if (!isReady) return;

    if (isAuthenticated && isAuthPage(pathname)) {
      // Use window.location.href for full page navigation — ensures cookies are sent
      window.location.href = "/dashboard";
    }
  }, [isReady, pathname, isAuthenticated]);

  if (!isReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Loading…</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
