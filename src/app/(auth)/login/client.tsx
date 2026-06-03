/**
 * Purpose: Login client component
 * Responsibility: Wire LoginForm with auth store and router
 * Important Notes:
 *   - Client component — uses auth store, searchParams
 *   - On login success → store token + user → redirect to dashboard (or ?redirect= param)
 *   - Uses window.location.href for FULL page navigation — guarantees cookies are sent
 *   - router.replace() uses client-side RSC navigation which can lose HttpOnly cookies
 *   - On "register" click → navigate to /register with optional mobile prefilled
 */

"use client";

import { useSearchParams } from "next/navigation";
import { LoginForm } from "@/features/auth/components/login-form";
import { useAuthStore } from "@/stores/auth-store";
import type { LoginSuccessData } from "@/features/auth/logic/auth-schemas";

export function LoginClient() {
  const searchParams = useSearchParams();
  const { login } = useAuthStore();

  function handleSuccess(data: LoginSuccessData) {
    login(data.user, data.token);
    // Full page navigation — guarantees the HttpOnly cookie (nr_refresh_token)
    // is included in the next request to /dashboard (or redirect target).
    // router.replace() uses RSC client navigation which may not carry cookies
    // through proxy.ts correctly on the first hop after Set-Cookie.
    const redirectTo = searchParams.get("redirect") || "/dashboard";
    window.location.href = redirectTo;
  }

  function handleSwitchToRegister(mobile?: string) {
    const params = mobile ? `?mobile=${mobile}` : "";
    window.location.href = `/register${params}`;
  }

  return (
    <LoginForm
      onSuccess={handleSuccess}
      onSwitchToRegister={handleSwitchToRegister}
    />
  );
}
