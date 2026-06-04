/**
 * Purpose: Admin Offers page
 * Responsibility: Coming Soon placeholder
 */

import type { Metadata } from "next";
import { AdminComingSoon } from "@/features/shell/components/admin-coming-soon";

export const metadata: Metadata = {
  title: "Admin Offers — Nikharta Roop",
  description: "Create and manage promotional offers",
};

export default function AdminOffersPage() {
  return <AdminComingSoon title="Offers" description="Create and manage promotional offers" />;
}
