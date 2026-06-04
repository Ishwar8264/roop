import { Skeleton } from "@/components/ui/skeleton";

export default function BranchDetailLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Skeleton className="h-8 w-8" />
        <Skeleton className="h-8 w-48" />
      </div>
      <Skeleton className="h-40 w-full rounded-lg" />
      <Skeleton className="h-60 w-full rounded-lg" />
    </div>
  );
}
