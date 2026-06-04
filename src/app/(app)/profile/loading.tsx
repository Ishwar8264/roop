/**
 * Purpose: Profile-specific loading skeleton
 * Responsibility: Show the ProfileSkeleton component during profile page load
 * Important Notes:
 *   - Uses the existing ProfileSkeleton component
 *   - Provides streaming/Suspense-compatible loading state
 */

import { ProfileSkeleton } from "@/features/user/components/profile-skeleton";

export default function ProfileLoading() {
  return <ProfileSkeleton />;
}
