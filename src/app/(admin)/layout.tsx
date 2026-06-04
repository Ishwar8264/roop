/**
 * Purpose: Admin pages layout (dashboard, bookings, staff, etc.)
 * Responsibility: Wrap admin pages with AdminShell (sidebar + header)
 * Important Notes:
 *   - Route group (admin) — does NOT appear in URL
 *   - Server component — just composes AdminShell with children
 *   - AdminShell (client) handles role check + responsive layout
 */

import { AdminShell } from "@/features/shell/components/admin-shell";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AdminShell>{children}</AdminShell>;
}
