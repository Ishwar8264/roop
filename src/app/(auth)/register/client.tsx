/**
 * Purpose: Register client component
 * Responsibility: Wire RegisterForm with auth store and router
 * Important Notes:
 *   - Client component — uses auth store, searchParams
 *   - On register success → store token + user → redirect to dashboard
 *   - Uses window.location.href for FULL page navigation — guarantees cookies are sent
 *   - On "login" click → navigate to /login
 *   - Reads ?mobile= from URL to prefill mobile from login page
 */

"use client";

import { useSearchParams } from "next/navigation";
import { RegisterForm } from "@/features/auth/components/register-form";
import { useAuthStore } from "@/stores/auth-store";
import type { RegisterSuccessData } from "@/features/auth/logic/auth-schemas";

export function RegisterClient() {
  const searchParams = useSearchParams();
  const { login } = useAuthStore();

  const prefilledMobile = searchParams.get("mobile") || undefined;

  function handleSuccess(data: RegisterSuccessData) {
    login(data.user, data.token);
    // Full page navigation — guarantees the HttpOnly cookie (nr_refresh_token)
    // is included in the next request to /dashboard.
    const redirectTo = searchParams.get("redirect") || "/dashboard";
    window.location.href = redirectTo;
  }

  return (
    <RegisterForm
      onSuccess={handleSuccess}
      onSwitchToLogin={() => { window.location.href = "/login"; }}
      prefilledMobile={prefilledMobile}
    />
  );
}
