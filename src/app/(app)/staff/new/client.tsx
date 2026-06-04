/**
 * Purpose: Create new staff — client component
 * Responsibility: Render StaffForm in create mode with return URL
 */

"use client";

import { StaffForm } from "@/features/staff/components/staff-form";

export function StaffFormPage() {
  return <StaffForm mode="create" returnUrl="/staff" />;
}
