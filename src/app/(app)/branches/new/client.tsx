/**
 * Purpose: Create new branch — client component
 * Responsibility: Render BranchForm in create mode with return URL
 */

"use client";

import { BranchForm } from "@/features/branch/components/branch-form";

export function BranchFormPage() {
  return <BranchForm mode="create" returnUrl="/branches" />;
}
