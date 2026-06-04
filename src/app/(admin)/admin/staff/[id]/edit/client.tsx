/**
 * Purpose: Admin — Edit staff (client component)
 * Responsibility: Fetch staff data and render StaffForm in edit mode
 */

"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { useStaff } from "@/features/staff/hooks/use-staff";
import { StaffForm } from "@/features/staff/components/staff-form";

export function EditStaffClient({ staffId }: { staffId: string }) {
  const { data: staff, isLoading } = useStaff(staffId);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!staff) {
    return (
      <div className="flex items-center justify-center py-12 text-center">
        <p className="text-muted-foreground">Staff not found</p>
      </div>
    );
  }

  return (
    <StaffForm
      mode="edit"
      staffId={staffId}
      defaultValues={{
        userId: staff.userId,
        branchId: staff.branchId,
        specialization: staff.specialization,
        experienceYears: staff.experienceYears,
        bioHi: staff.bioHi,
        bioEn: staff.bioEn,
        workStart: staff.workStart,
        workEnd: staff.workEnd,
        commissionRate: staff.commissionRate,
        workDays: staff.workDays,
      }}
      returnUrl="/admin/staff"
    />
  );
}
