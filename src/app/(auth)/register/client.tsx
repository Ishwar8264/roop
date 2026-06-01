/**
 * Purpose: Register client component
 * Responsibility: Wire RegisterForm with auth store and router
 * Important Notes:
 *   - Client component — uses router, auth store
 *   - On register success → store token + user → redirect to dashboard
 *   - On "login" click → navigate to /login
 */

"use client";

import { useRouter } from "next/navigation";
import { RegisterForm } from "@/features/auth/components/register-form";
import { useAuthStore } from "@/stores/auth-store";
import type { UserProfile } from "@/types";

export function RegisterClient() {
  const router = useRouter();
  const { login } = useAuthStore();

  function handleSuccess(data: { user: UserProfile; token: string }) {
    login(data.user, data.token);
    router.push("/dashboard");
  }

  return (
    <RegisterForm
      onSuccess={handleSuccess}
      onSwitchToLogin={() => router.push("/login")}
    />
  );
}
