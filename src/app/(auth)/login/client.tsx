/**
 * Purpose: Login client component
 * Responsibility: Wire LoginForm with auth store and router
 * Important Notes:
 *   - Client component — uses auth store, searchParams
 *   - On login success → store user only; tokens are HttpOnly cookies
 *   - Uses window.location.href for FULL page navigation — guarantees cookies are sent
 *   - Small delay (100ms) before redirect to ensure browser processes Set-Cookie headers
 *   - On "register" click → navigate to /register with optional mobile prefilled
 */

"use client";

import { useSearchParams } from "next/navigation";
import { LoginForm } from "@/features/auth/components/login-form";
import { useAuthStore } from "@/stores/auth-store";
import type { LoginSuccessData } from "@/features/auth/logic/auth-schemas";

function getSafeRedirectPath(value: string | null): string {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/dashboard";
  }

  return value;
}

export function LoginClient() {
  const searchParams = useSearchParams();
  const { login } = useAuthStore();

  function handleSuccess(data: LoginSuccessData) {
    login(data.user);
    // Small delay to ensure browser has processed the Set-Cookie headers
    // from the verify-otp response before navigating
    const redirectTo = getSafeRedirectPath(searchParams.get("redirect"));
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
