/**
 * Purpose: Register client component
 * Responsibility: Wire RegisterForm with auth store and router
 * Important Notes:
 *   - Client component — uses router, auth store, searchParams
 *   - On register success → store token + user → redirect to dashboard
 *   - On "login" click → navigate to /login
 *   - Reads ?mobile= from URL to prefill mobile from login page
 */

"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { RegisterForm } from "@/features/auth/components/register-form";
import { useAuthStore } from "@/stores/auth-store";
import type { UserProfile } from "@/types";

export function RegisterClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuthStore();

  const prefilledMobile = searchParams.get("mobile") || undefined;

  function handleSuccess(data: { user: UserProfile; token: string }) {
    login(data.user, data.token);
    router.push("/dashboard");
  }

  return (
    <RegisterForm
      onSuccess={handleSuccess}
      onSwitchToLogin={() => router.push("/login")}
      prefilledMobile={prefilledMobile}
    />
  );
}
