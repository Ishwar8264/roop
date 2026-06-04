/**
 * Purpose: Admin Staff management page
 */

import type { Metadata } from "next";
import { AdminStaffClient } from "./client";

export const metadata: Metadata = {
  title: "Admin Staff — Nikharta Roop",
  description: "Manage staff, leaves, services and availability",
};

export default function AdminStaffPage() {
  return <AdminStaffClient />;
}
