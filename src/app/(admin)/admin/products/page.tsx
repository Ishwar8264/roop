/**
 * Purpose: Admin Products page
 * Responsibility: Coming Soon placeholder
 */

import type { Metadata } from "next";
import { AdminComingSoon } from "@/features/shell/components/admin-coming-soon";

export const metadata: Metadata = {
  title: "Admin Products — Nikharta Roop",
  description: "Product catalog and sales management",
};

export default function AdminProductsPage() {
  return <AdminComingSoon title="Products" description="Product catalog and sales management" />;
}
