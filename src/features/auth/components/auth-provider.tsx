/**
 * Purpose: Auth initialization provider
 * Responsibility: Initialize auth state on mount, sync Zustand with /api/auth/me
 * Important Notes:
 *   - Must be "use client" — uses useEffect, useState
 *   - Wrap this around {children} in root layout — ONE time only
 *   - On mount: WAITS for Zustand persist rehydration from sessionStorage, then validates token
 *   - If token exists but is stale: tries /api/auth/me to validate, then refresh if 401
 *   - Shows loading screen until auth state is determined
 *   - IMPORTANT: Loading screen has timeout (5s) to avoid blocking if API is down
 *   - Route protection is PRIMARILY handled by src/proxy.ts (server-side)
 *   - This component ALSO handles client-side redirects as a FALLBACK for when
 *     proxy.ts cookies aren't available (e.g., fetch() Set-Cookie not processed yet)
 *   - CRITICAL FIX: Waits for Zustand persist rehydration before reading token.
 *     Without this, the token is null on page reload because persist is async.
 */

"use client";

import { useState, useEffect, useCallback, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { useAuthStore } from "@/stores/auth-store";
import { apiClient } from "@/services/api-client";
import type { ApiResponse } from "@/types";
import type { UserProfile } from "@/types";

// ==================== Auth Pages ====================

const AUTH_PAGES = ["/login", "/register", "/auth/callback"];

function isAuthPage(pathname: string): boolean {
  return AUTH_PAGES.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );
}

// ==================== Persist Rehydration Helper ====================

/**
 * Wait for Zustand persist middleware to finish rehydrating from sessionStorage.
 * Without this, useAuthStore.getState().token returns null on page reload
 * because persist rehydration is asynchronous.
 */
function waitForRehydration(): Promise<void> {
  // Already hydrated — no need to wait
  if (useAuthStore.persist.hasHydrated()) {
    return Promise.resolve();
  }

  return new Promise<void>((resolve) => {
    // Listen for the finishHydration event
    const unsub = useAuthStore.persist.onFinishHydration(() => {
      unsub();
      resolve();
    });

    // Safety timeout — if hydration doesn't finish in 1s, proceed anyway
    // (the store might have no saved state, which is fine)
    setTimeout(() => {
      unsub();
      resolve();
    }, 1000);
  });
}

// ==================== Auth Provider ====================

export function AuthProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [isReady, setIsReady] = useState(false);

  // Subscribe to isAuthenticated for the redirect effect
  // Using the hook (not getState()) so React re-renders when it changes
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  // Initialize auth state on mount — sync Zustand with backend
  const initAuth = useCallback(async (signal: AbortSignal) => {
    // 1. Wait for Zustand persist to finish rehydrating from sessionStorage
    //    CRITICAL: Without this, token is null on page reload because
    //    persist rehydration is async and hasn't completed yet
    await waitForRehydration();

    // 2. If there's a stored token, verify it's still valid
    const currentToken = useAuthStore.getState().token;
    if (currentToken) {
      try {
        const res = await apiClient.get<ApiResponse<{ user: UserProfile }>>(
          "/auth/me"
        );
        if (res.success && res.data?.user) {
          useAuthStore.getState().setUser(res.data.user);
        }
      } catch {
        // Token invalid or expired — auto-refresh attempted by api-client
        // If we're here, refresh also failed
        if (!signal.aborted) {
          useAuthStore.getState().logout();
        }
      }
    }

    if (!signal.aborted) {
      setIsReady(true);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    // eslint-disable-next-line react-hooks/set-state-in-effect -- auth init must set ready state
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
