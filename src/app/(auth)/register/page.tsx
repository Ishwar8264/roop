/**
 * Purpose: Register page (server component)
 * Responsibility: SEO metadata + render client component with Suspense
 * Important Notes:
 *   - Suspense required because client uses useSearchParams
 */

import type { Metadata } from "next";
import { Suspense } from "react";
import { RegisterClient } from "./client";

export const metadata: Metadata = {
  title: "रजिस्टर — निखरता रूप",
  description: "नया अकाउंट बनाएं — निखरता रूप ब्यूटी पार्लर",
};

export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterClient />
    </Suspense>
  );
}
