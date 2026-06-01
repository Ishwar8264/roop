/**
 * Purpose: Dashboard page (server component)
 * Responsibility: SEO metadata + render client component
 */

import type { Metadata } from "next";
import { DashboardClient } from "./client";

export const metadata: Metadata = {
  title: "डैशबोर्ड — निखरता रूप",
  description: "अपना डैशबोर्ड — बुकिंग, सेवाएं, और ऑफ़र देखें",
};

export default function DashboardPage() {
  return <DashboardClient />;
}
