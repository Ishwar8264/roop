/**
 * Purpose: Admin Commissions page
 * Responsibility: Coming Soon placeholder
 */

import type { Metadata } from "next";
import { AdminComingSoon } from "@/features/shell/components/admin-coming-soon";

export const metadata: Metadata = {
  title: "Admin Commissions — Nikharta Roop",
  description: "Staff commission tracking and payments",
};

export default function AdminCommissionsPage() {
  return <AdminComingSoon title="Commissions" description="Staff commission tracking and payments" />;
}
