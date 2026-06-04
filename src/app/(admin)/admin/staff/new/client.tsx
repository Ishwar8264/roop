/**
 * Purpose: Admin — Create new staff (client component)
 * Responsibility: Render StaffForm in create mode
 */

"use client";

import { StaffForm } from "@/features/staff/components/staff-form";

export function NewStaffClient() {
  return <StaffForm mode="create" returnUrl="/admin/staff" />;
}
