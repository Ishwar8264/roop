/**
 * Purpose: Admin Notifications page
 * Responsibility: Coming Soon placeholder
 */

import type { Metadata } from "next";
import { AdminComingSoon } from "@/features/shell/components/admin-coming-soon";

export const metadata: Metadata = {
  title: "Admin Notifications — Nikharta Roop",
  description: "Notification management and sending",
};

export default function AdminNotificationsPage() {
  return <AdminComingSoon title="Notifications" description="Notification management and sending" />;
}
