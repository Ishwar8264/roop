/**
 * Purpose: Admin — Create new branch page
 * Responsibility: Render BranchForm in create mode with admin return URL
 */

"use client";

import { BranchForm } from "@/features/branch/components/branch-form";

export default function AdminNewBranchPage() {
  return <BranchForm mode="create" returnUrl="/admin/branches" />;
}
