/**
 * Purpose: Login page (server component)
 * Responsibility: SEO metadata + render client component with Suspense
 * Important Notes:
 *   - Server component — metadata for SEO
 *   - Client logic in ./client.tsx
 *   - Suspense required because client uses useSearchParams
 */

import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginClient } from "./client";

export const metadata: Metadata = {
  title: "लॉगिन — निखरता रूप",
  description: "अपना अकाउंट एक्सेस करें — मोबाइल OTP या ईमेल से लॉगिन करें",
};

export default function LoginPage() {
  return (
    <Suspense>
      <LoginClient />
    </Suspense>
  );
}
