/**
 * Purpose: App pages layout (dashboard, services, bookings, profile)
 * Responsibility: Wrap app pages with AppShell (header + bottom nav)
 * Important Notes:
 *   - Route group (app) — does NOT appear in URL
 *   - Server component — just composes AppShell with children
 *   - AppShell (client) handles all responsive logic internally
 *   - Auth pages use (auth)/layout.tsx — no navigation
 */

import { AppShell } from "@/features/shell/components/app-shell";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppShell>{children}</AppShell>;
}
