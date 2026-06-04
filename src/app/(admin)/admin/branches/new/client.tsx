/**
 * Purpose: Admin — Create new branch (client component)
 * Responsibility: Render BranchForm in create mode
 */

"use client";

import { BranchForm } from "@/features/branch/components/branch-form";

export function NewBranchClient() {
  return <BranchForm mode="create" returnUrl="/admin/branches" />;
}
