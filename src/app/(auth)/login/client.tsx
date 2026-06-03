/**
 * Purpose: Login client component
 * Responsibility: Wire LoginForm with auth store and router
 * Important Notes:
 *   - Client component — uses auth store, searchParams
 *   - On login success → store token + user → redirect to dashboard (or ?redirect= param)
 *   - Uses window.location.href for FULL page navigation — guarantees cookies are sent
 *   - Small delay (100ms) before redirect to ensure browser processes Set-Cookie headers
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
    // Small delay to ensure browser has processed the Set-Cookie headers
    // from the verify-otp response before navigating
    const redirectTo = searchParams.get("redirect") || "/dashboard";
    setTimeout(() => {
      window.location.href = redirectTo;
    }, 100);
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
