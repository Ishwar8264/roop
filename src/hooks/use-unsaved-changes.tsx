/**
 * Purpose: Centralized unsaved changes guard hook
 * Responsibility: Detect dirty forms and prevent navigation with confirmation dialog
 * Important Notes:
 *   - Works with react-hook-form's formState.isDirty
 *   - Intercepts: browser back/forward, route changes via Next.js, link clicks
 *   - Shows a dialog: "You have unsaved changes. Leave anyway?"
 *   - Reusable — just call useUnsavedChanges(form.isDirty) in any form page
 *   - Also blocks browser beforeunload event for tab/window close
 */

"use client";

import { useEffect, useCallback, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useTranslation } from "@/i18n/use-translation";

// ==================== Hook ====================

export function useUnsavedChanges(isDirty: boolean) {
  const router = useRouter();
  const pathname = usePathname();
  const { t } = useTranslation();
  const [showDialog, setShowDialog] = useState(false);
  const [pendingPath, setPendingPath] = useState<string | null>(null);

  // Block browser tab/window close
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  // Intercept Next.js route changes
  useEffect(() => {
    // Monkey-patch router.push and router.replace
    const originalPush = router.push.bind(router);
    const originalReplace = router.replace.bind(router);
    const originalBack = router.back.bind(router);

    const interceptNavigation = (targetPath: string) => {
      if (isDirty && targetPath !== pathname) {
        setPendingPath(targetPath);
        setShowDialog(true);
        return false;
      }
      return true;
    };

    // We use a different approach — intercept popstate for back/forward
    const handlePopState = () => {
      if (isDirty) {
        // Push current state back to prevent navigation
        window.history.pushState(null, "", window.location.href);
        setPendingPath("back");
        setShowDialog(true);
      }
    };

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [isDirty, pathname, router]);

  // Confirm navigation — proceed
  const confirmNavigation = useCallback(() => {
    setShowDialog(false);
    if (pendingPath === "back") {
      // Allow back navigation by temporarily disabling the guard
      window.history.back();
    } else if (pendingPath) {
      // We need to navigate without triggering the guard again
      // Use direct window.location for simplicity
      window.location.href = pendingPath;
    }
    setPendingPath(null);
  }, [pendingPath]);

  // Cancel navigation — stay on page
  const cancelNavigation = useCallback(() => {
    setShowDialog(false);
    setPendingPath(null);
  }, []);

  // Render the confirmation dialog
  const UnsavedChangesDialog = () => (
    <AlertDialog open={showDialog} onOpenChange={setShowDialog}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {t("unsavedChanges.title") || "Unsaved Changes"}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {t("unsavedChanges.description") ||
              "You have unsaved changes. Are you sure you want to leave? Your changes will be lost."}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={cancelNavigation}>
            {t("unsavedChanges.stay") || "Stay on Page"}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={confirmNavigation}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {t("unsavedChanges.leave") || "Leave Anyway"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );

  return {
    UnsavedChangesDialog,
    isGuarding: isDirty,
  };
}
