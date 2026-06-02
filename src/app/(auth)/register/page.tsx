/**
 * Purpose: Register page (server component)
 * Responsibility: SEO metadata + render client component
 */

import type { Metadata } from "next";
import { RegisterClient } from "./client";

export const metadata: Metadata = {
  title: "रजिस्टर — निखरता रूप",
  description: "नया अकाउंट बनाएं — निखरता रूप ब्यूटी पार्लर",
};

export default function RegisterPage() {
  return <RegisterClient />;
}
