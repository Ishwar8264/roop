/**
 * Purpose: Centralized unsaved changes guard hook
 * Responsibility: Detect dirty forms and prevent navigation with confirmation dialog
 * Important Notes:
 *   - Works with react-hook-form's formState.isDirty
 *   - Intercepts: back button clicks, cancel button clicks, browser back/forward
 *   - Shows a dialog: "You have unsaved changes. Leave anyway?"
 *   - Reusable — just call useUnsavedChanges(isDirty) in any form page
 *   - Also blocks browser beforeunload event for tab/window close
 *   - Provides `navigateAway(path)` function for form buttons to use
 */

"use client";

import { useEffect, useCallback, useState, useRef } from "react";
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
  const isDirtyRef = useRef(isDirty);

  // Keep ref in sync so event listeners always have latest value
  useEffect(() => {
    isDirtyRef.current = isDirty;
  }, [isDirty]);

  // Block browser tab/window close
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirtyRef.current) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, []);

  // Intercept browser back/forward buttons via popstate
  useEffect(() => {
    const handlePopState = () => {
      if (isDirtyRef.current) {
        // Push current state back to prevent navigation
        window.history.pushState(null, "", window.location.href);
        setPendingPath("back");
        setShowDialog(true);
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  // Confirm navigation — actually leave the page
  const confirmNavigation = useCallback(() => {
    setShowDialog(false);
    // Temporarily disable the guard so the next navigation goes through
    isDirtyRef.current = false;

    if (pendingPath === "back") {
      router.back();
    } else if (pendingPath) {
      router.push(pendingPath);
    }
    setPendingPath(null);
  }, [pendingPath, router]);

  // Cancel navigation — stay on page
  const cancelNavigation = useCallback(() => {
    setShowDialog(false);
    setPendingPath(null);
  }, []);

  /**
   * Safe navigation function — call this from back/cancel buttons.
   * If form is dirty, shows the confirmation dialog instead of navigating.
   * If form is clean, navigates immediately.
   */
  const navigateAway = useCallback(
    (path: string) => {
      if (isDirtyRef.current) {
        setPendingPath(path);
        setShowDialog(true);
      } else {
        router.push(path);
      }
    },
    [router]
  );

  // Render the confirmation dialog
  const UnsavedChangesDialog = () => (
    <AlertDialog open={showDialog} onOpenChange={(open) => { if (!open) cancelNavigation(); }}>
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
    navigateAway,
    isGuarding: isDirty,
  };
}
