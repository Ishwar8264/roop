/**
 * Purpose: Admin Blog page
 * Responsibility: Coming Soon placeholder
 */

import type { Metadata } from "next";
import { AdminComingSoon } from "@/features/shell/components/admin-coming-soon";

export const metadata: Metadata = {
  title: "Admin Blog — Nikharta Roop",
  description: "Blog posts and content management",
};

export default function AdminBlogPage() {
  return <AdminComingSoon title="Blog" description="Blog posts and content management" />;
}
