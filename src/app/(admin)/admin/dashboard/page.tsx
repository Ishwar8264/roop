/**
 * Purpose: Admin Dashboard overview page
 * Responsibility: Show admin stats overview with quick links
 */

import type { Metadata } from "next";
import { AdminDashboardClient } from "./client";

export const metadata: Metadata = {
  title: "Admin Dashboard — Nikharta Roop",
  description: "Admin control panel — manage your beauty parlour",
};

export default function AdminDashboardPage() {
  return <AdminDashboardClient />;
}
