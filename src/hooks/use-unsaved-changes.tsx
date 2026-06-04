/**
 * Purpose: Centralized unsaved changes guard hook
 * Responsibility: Detect dirty forms and prevent navigation with confirmation dialog
 * Important Notes:
 *   - Works with react-hook-form's formState.isDirty
 *   - Intercepts: browser back/forward, cancel button clicks
 *   - Shows a dialog: "You have unsaved changes. Leave anyway?"
 *   - Reusable — just call useUnsavedChanges(isDirty) in any form page
 *   - Also blocks browser beforeunload event for tab/window close
 *   - Provides `navigateAway(path)` function for cancel buttons
 *   - Does NOT use useRouter.push/back — uses window.location for confirmed navigation
 *     to avoid re-triggering the popstate guard
 */

"use client";

import { useEffect, useCallback, useState, useRef } from "react";
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
  const { t } = useTranslation();
  const [showDialog, setShowDialog] = useState(false);
  const [pendingPath, setPendingPath] = useState<string | null>(null);
  const isDirtyRef = useRef(isDirty);
  const isConfirmingRef = useRef(false); // Guard against re-triggering

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
      // If we're confirming, let the navigation through
      if (isConfirmingRef.current) {
        isConfirmingRef.current = false;
        return;
      }

      if (isDirtyRef.current) {
        // Push current state back to prevent navigation
        window.history.pushState(null, "", window.location.href);
        setPendingPath("back");
        setShowDialog(true);
      }
    };

    // Push initial state so popstate fires on first back
    window.history.pushState(null, "", window.location.href);

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  // Confirm navigation — actually leave the page
  const confirmNavigation = useCallback(() => {
    setShowDialog(false);
    // Temporarily disable the guard so the next navigation goes through
    isDirtyRef.current = false;
    isConfirmingRef.current = true;

    if (pendingPath === "back") {
      // Use window.history.back() + flag to avoid re-triggering popstate guard
      // The isConfirmingRef prevents the popstate handler from re-showing dialog
      window.history.back();
    } else if (pendingPath) {
      // Use direct window.location for path navigation to avoid useRouter
      // which would trigger Next.js route changes that popstate might intercept
      window.location.href = pendingPath;
    }
    setPendingPath(null);
  }, [pendingPath]);

  // Cancel navigation — stay on page
  const cancelNavigation = useCallback(() => {
    setShowDialog(false);
    setPendingPath(null);
  }, []);

  /**
   * Safe navigation function — call this from cancel buttons.
   * If form is dirty, shows the confirmation dialog instead of navigating.
   * If form is clean, navigates immediately using window.location.
   */
  const navigateAway = useCallback(
    (path: string) => {
      if (isDirtyRef.current) {
        setPendingPath(path);
        setShowDialog(true);
      } else {
        window.location.href = path;
      }
    },
    []
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
