/**
 * Purpose: Admin Branches management page
 * Responsibility: Show all branches with admin controls
 */

import type { Metadata } from "next";
import { AdminBranchesClient } from "./client";

export const metadata: Metadata = {
  title: "Admin Branches — Nikharta Roop",
  description: "Manage parlour branches, holidays and status",
};

export default function AdminBranchesPage() {
  return <AdminBranchesClient />;
}
