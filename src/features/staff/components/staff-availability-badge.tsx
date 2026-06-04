"use client";

import { Badge } from "@/components/ui/badge";

interface StaffAvailabilityBadgeProps {
  isAvailable: boolean;
}

export function StaffAvailabilityBadge({
  isAvailable,
}: StaffAvailabilityBadgeProps) {
  return isAvailable ? (
    <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 hover:bg-emerald-100 text-xs">
      Available
    </Badge>
  ) : (
    <Badge className="bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 hover:bg-gray-100 text-xs">
      Unavailable
    </Badge>
  );
}
