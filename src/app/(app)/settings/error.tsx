/**
 * Purpose: Settings-specific error boundary
 * Responsibility: Catch and display errors on the settings page with retry button
 * Important Notes:
 *   - Must be a client component
 *   - Rose pink theme matching the app
 */

"use client";

import { AlertTriangle, RotateCw, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export default function SettingsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-rose-100 dark:bg-rose-900/30 mb-6">
        <AlertTriangle className="h-8 w-8 text-rose-500" />
      </div>
      <h2 className="text-xl font-bold text-foreground mb-2">
        Failed to load settings
      </h2>
      <p className="text-sm text-muted-foreground max-w-sm mb-6">
        {error.message || "Something went wrong while loading your settings."}
      </p>
      <div className="flex gap-3">
        <Button
          variant="outline"
          onClick={() => router.push("/profile")}
          className="gap-2"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to Profile
        </Button>
        <Button
          onClick={reset}
          className="bg-rose-500 hover:bg-rose-600 text-white gap-2"
        >
          <RotateCw className="h-4 w-4" />
          Try Again
        </Button>
      </div>
    </div>
  );
}
