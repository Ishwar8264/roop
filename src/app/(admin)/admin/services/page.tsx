/**
 * Purpose: Admin Services page
 * Responsibility: Coming Soon placeholder
 */

import type { Metadata } from "next";
import { AdminComingSoon } from "@/features/shell/components/admin-coming-soon";

export const metadata: Metadata = {
  title: "Admin Services — Nikharta Roop",
  description: "Manage services, categories, variants and add-ons",
};

export default function AdminServicesPage() {
  return <AdminComingSoon title="Services" description="Manage services, categories, variants and add-ons" />;
}
