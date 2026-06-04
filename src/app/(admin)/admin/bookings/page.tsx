/**
 * Purpose: Admin Bookings page
 * Responsibility: Coming Soon placeholder
 */

import type { Metadata } from "next";
import { AdminComingSoon } from "@/features/shell/components/admin-coming-soon";

export const metadata: Metadata = {
  title: "Admin Bookings — Nikharta Roop",
  description: "Manage bookings, confirmations and cancellations",
};

export default function AdminBookingsPage() {
  return <AdminComingSoon title="Bookings" description="Manage bookings, confirmations and cancellations" />;
}
