/**
 * Purpose: Admin — Create new staff page
 * Responsibility: Render StaffForm in create mode with admin return URL
 */

"use client";

import { StaffForm } from "@/features/staff/components/staff-form";

export default function AdminNewStaffPage() {
  return <StaffForm mode="create" returnUrl="/admin/staff" />;
}
