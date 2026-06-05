/**
 * Purpose: Register client component
 * Responsibility: Wire RegisterForm with auth store and router
 * Important Notes:
 *   - Client component — uses auth store, searchParams
 *   - On register success → store user only; tokens are HttpOnly cookies
 *   - Uses window.location.href for FULL page navigation — guarantees cookies are sent
 *   - Small delay (100ms) before redirect to ensure browser processes Set-Cookie headers
 *   - On "login" click → navigate to /login
 *   - Reads ?mobile= from URL to prefill mobile from login page
 */

"use client";

import { useSearchParams } from "next/navigation";
import { RegisterForm } from "@/features/auth/components/register-form";
import { useAuthStore } from "@/stores/auth-store";
import type { RegisterSuccessData } from "@/features/auth/logic/auth-schemas";

function getSafeRedirectPath(value: string | null): string {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/dashboard";
  }

  return value;
}

export function RegisterClient() {
  const searchParams = useSearchParams();
  const { login } = useAuthStore();

  const prefilledMobile = searchParams.get("mobile") || undefined;

  function handleSuccess(data: RegisterSuccessData) {
    login(data.user);
    // Small delay to ensure browser has processed the Set-Cookie headers
    const redirectTo = getSafeRedirectPath(searchParams.get("redirect"));
    setTimeout(() => {
      window.location.href = redirectTo;
    }, 100);
  }

  return (
    <RegisterForm
      onSuccess={handleSuccess}
      onSwitchToLogin={() => { window.location.href = "/login"; }}
      prefilledMobile={prefilledMobile}
    />
  );
}
