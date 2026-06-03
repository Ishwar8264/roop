/**
 * Purpose: Loading skeleton for the entire profile page
 * Responsibility: Show shimmer placeholders matching profile page layout
 * Important Notes:
 *   - Avatar circle + text lines + card shapes
 *   - Matches the layout of ProfileHeader, PersonalInfoCard, SecurityCard
 */

"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export function ProfileSkeleton() {
  return (
    <div className="space-y-6">
      {/* Profile Header Skeleton */}
      <div className="relative backdrop-blur-xl bg-white/70 dark:bg-card/70 rounded-3xl shadow-2xl shadow-rose-500/10 border border-white/50 dark:border-border/50 p-8 overflow-hidden">
        <div className="flex flex-col items-center gap-4">
          {/* Avatar */}
          <Skeleton className="h-24 w-24 rounded-full" />
          {/* Name */}
          <Skeleton className="h-6 w-40" />
          {/* Email + Phone */}
          <div className="flex flex-col gap-2 items-center">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-4 w-36" />
          </div>
          {/* Loyalty badge */}
          <Skeleton className="h-7 w-32 rounded-full" />
          {/* Separator */}
          <Skeleton className="h-px w-full max-w-xs" />
          {/* Quick actions */}
          <div className="grid grid-cols-3 gap-3 w-full">
            <Skeleton className="h-16 rounded-lg" />
            <Skeleton className="h-16 rounded-lg" />
            <Skeleton className="h-16 rounded-lg" />
          </div>
        </div>
      </div>

      {/* Personal Info Card Skeleton */}
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-36" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <Skeleton className="h-9 w-9 rounded-lg shrink-0" />
            <div className="space-y-1.5 flex-1">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
          <Skeleton className="h-px w-full" />
          <div className="flex items-center gap-3">
            <Skeleton className="h-9 w-9 rounded-lg shrink-0" />
            <div className="space-y-1.5 flex-1">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-4 w-48" />
            </div>
          </div>
          <Skeleton className="h-px w-full" />
          <div className="flex items-center gap-3">
            <Skeleton className="h-9 w-9 rounded-lg shrink-0" />
            <div className="space-y-1.5 flex-1">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-4 w-28" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Security Card Skeleton */}
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-24" />
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center gap-3">
            <Skeleton className="h-9 w-9 rounded-lg shrink-0" />
            <div className="space-y-1.5 flex-1">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-3 w-48" />
            </div>
          </div>
          <Skeleton className="h-px w-full" />
          <div className="flex items-center gap-3">
            <Skeleton className="h-9 w-9 rounded-lg shrink-0" />
            <div className="space-y-1.5 flex-1">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-40" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
