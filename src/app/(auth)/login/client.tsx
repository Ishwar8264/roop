/**
 * Purpose: Login client component
 * Responsibility: Wire LoginForm with auth store and router
 * Important Notes:
 *   - Client component — uses router, auth store
 *   - On login success → store token + user → redirect to dashboard
 *   - Uses router.replace for immediate redirect (no history entry)
 *   - On "register" click → navigate to /register
 */

"use client";

import { useRouter } from "next/navigation";
import { LoginForm } from "@/features/auth/components/login-form";
import { useAuthStore } from "@/stores/auth-store";
import type { UserProfile } from "@/types";

export function LoginClient() {
  const router = useRouter();
  const { login } = useAuthStore();

  function handleSuccess(data: { user: UserProfile; token: string }) {
    login(data.user, data.token);
    // Use replace so user can't press Back to go to login
    router.replace("/dashboard");
  }

  return (
    <LoginForm
      onSuccess={handleSuccess}
      onSwitchToRegister={() => router.push("/register")}
    />
  );
}
