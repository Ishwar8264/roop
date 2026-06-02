/**
 * Purpose: Dashboard page (server component)
 * Responsibility: SEO metadata + render client component
 */

import type { Metadata } from "next";
import { DashboardClient } from "./client";

export const metadata: Metadata = {
  title: "Dashboard — Nikharta Roop",
  description: "Your dashboard — bookings, services, and offers",
};

export default function DashboardPage() {
  return <DashboardClient />;
}
