/**
 * Purpose: Auth initialization provider, React Query wrapper, and client-side route guard
 * Responsibility: Initialize auth state on mount, protect authenticated pages, provide QueryClient
 * Important Notes:
 *   - Must be "use client" — uses useEffect, useState, useRouter, usePathname
 *   - Wrap this around {children} in root layout — ONE time only
 *   - On mount: restores Zustand state (persist already did sessionStorage restore)
 *   - If token exists but is stale: tries /api/auth/me to validate, then refresh if 401
 *   - Shows loading screen until auth state is determined
 *   - IMPORTANT: Loading screen has timeout (3s) to avoid blocking if API is down
 *   - Client-side route guard: redirects unauthenticated users from protected pages
 */

"use client";

import { useState, useEffect, type ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useAuthStore } from "@/stores/auth-store";
import { apiClient } from "@/services/api-client";
import type { ApiResponse } from "@/types";
import type { UserProfile } from "@/types";

// ==================== Query Client ====================

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,
        retry: 1,
        refetchOnWindowFocus: false,
      },
    },
  });
}

let browserQueryClient: QueryClient | undefined;

function getQueryClient() {
  if (typeof window === "undefined") {
    return makeQueryClient();
  }
  if (!browserQueryClient) {
    browserQueryClient = makeQueryClient();
  }
  return browserQueryClient;
}

// ==================== Route Config ====================

// Pages that DON'T require authentication
const PUBLIC_PAGES = ["/", "/login", "/register"];

// ==================== Auth Provider ====================

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = getQueryClient();
  const [isReady, setIsReady] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  // Step 1: Initialize auth state on mount
  useEffect(() => {
    let cancelled = false;

    async function initAuth() {
      // 1. Let Zustand persist restore from sessionStorage
      useAuthStore.getState().initialize();

      // 2. If there's a stored token, verify it's still valid
      const currentToken = useAuthStore.getState().token;
      if (currentToken) {
        try {
          const res = await apiClient.get<ApiResponse<{ user: UserProfile }>>(
            "/auth/me"
          );
          if (res.success && res.data?.user) {
            if (!cancelled) {
              useAuthStore.getState().setUser(res.data.user);
            }
          }
        } catch {
          // Token invalid or expired — auto-refresh attempted by api-client
          // If we're here, refresh also failed
          if (!cancelled) {
            useAuthStore.getState().logout();
          }
        }
      }

      if (!cancelled) {
        setIsReady(true);
      }
    }

    initAuth();

    // Safety timeout — don't block UI forever if API is slow
    const timeout = setTimeout(() => {
      if (!cancelled) setIsReady(true);
    }, 3000);

    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Step 2: Client-side route guard — redirect based on auth state
  useEffect(() => {
    if (!isReady) return;

    const { isAuthenticated } = useAuthStore.getState();
    const isPublicPage = PUBLIC_PAGES.some(
      (p) => pathname === p || pathname.startsWith(p + "/")
    );

    // If authenticated and on login/register → redirect to dashboard
    if (isAuthenticated && (pathname === "/login" || pathname === "/register")) {
      router.replace("/dashboard");
      return;
    }

    // If NOT authenticated and on a protected page → redirect to login
    if (!isAuthenticated && !isPublicPage) {
      router.replace("/login");
      return;
    }
  }, [isReady, pathname, router]);

  if (!isReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">लोड हो रहा है...</p>
        </div>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
