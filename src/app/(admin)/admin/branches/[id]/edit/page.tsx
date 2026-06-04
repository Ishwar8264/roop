/**
 * Purpose: Admin — Edit branch page
 * Responsibility: Fetch branch data and render BranchForm in edit mode
 */

"use client";

import { useParams } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { useBranch } from "@/features/branch/hooks/use-branch";
import { BranchForm } from "@/features/branch/components/branch-form";
import type { LocationData } from "@/components/shared/location-picker";

/** Try to extract lat,lng from a Google Maps URL */
function parseLocationFromUrl(url: string | null): LocationData | null {
  if (!url) return null;
  const match = url.match(/[?&]q=([+-]?\d+\.?\d*),([+-]?\d+\.?\d*)/);
  if (match) {
    return {
      lat: parseFloat(match[1]),
      lng: parseFloat(match[2]),
      address: "",
      city: "",
      googleMapsUrl: url,
    };
  }
  return null;
}

export default function AdminEditBranchPage() {
  const params = useParams();
  const id = params.id as string;
  const { data: branch, isLoading } = useBranch(id);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!branch) {
    return (
      <div className="flex items-center justify-center py-12 text-center">
        <p className="text-muted-foreground">Branch not found</p>
      </div>
    );
  }

  const defaultLocation = parseLocationFromUrl(branch.googleMapsUrl);

  return (
    <BranchForm
      mode="edit"
      branchId={id}
      defaultValues={{
        nameHi: branch.nameHi,
        nameEn: branch.nameEn,
        city: branch.city,
        address: branch.address,
        phone: branch.phone,
        googleMapsUrl: branch.googleMapsUrl ?? "",
        openTime: branch.openTime,
        closeTime: branch.closeTime,
      }}
      defaultLocation={defaultLocation}
      returnUrl="/admin/branches"
    />
  );
}
