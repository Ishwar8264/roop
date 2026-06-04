/**
 * Purpose: Admin Consultations page
 * Responsibility: Coming Soon placeholder
 */

import type { Metadata } from "next";
import { AdminComingSoon } from "@/features/shell/components/admin-coming-soon";

export const metadata: Metadata = {
  title: "Admin Consultations — Nikharta Roop",
  description: "Consultation bookings and management",
};

export default function AdminConsultationsPage() {
  return <AdminComingSoon title="Consultations" description="Consultation bookings and management" />;
}
