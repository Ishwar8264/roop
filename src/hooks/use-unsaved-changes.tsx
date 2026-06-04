/**
 * Purpose: Centralized unsaved changes guard hook
 * Responsibility: Detect dirty forms and prevent navigation with confirmation dialog
 * Important Notes:
 *   - Works with react-hook-form's formState.isDirty
 *   - Intercepts: browser back/forward, cancel button clicks, sidebar nav clicks
 *   - Shows AlertDialog: "You have unsaved changes. Leave anyway?"
 *   - Uses Next.js useRouter for navigation (proper client-side routing)
 *   - Also blocks browser beforeunload for tab/window close
 *   - Provides navigateAway(path) for cancel/back buttons
 *   - After successful submit, caller should call router.push directly (bypass guard)
 */

"use client";

import { useEffect, useCallback, useState, useRef } from "react";
import { useRouter } from "next/navigation";
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
  const { t } = useTranslation();
  const [showDialog, setShowDialog] = useState(false);
  const [pendingPath, setPendingPath] = useState<string | null>(null);
  const isDirtyRef = useRef(isDirty);
  const skipNextPopstate = useRef(false);

  // Keep ref in sync
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

  // Intercept browser back/forward via popstate
  useEffect(() => {
    // Push a history entry so we can intercept the first back
    window.history.pushState(null, "", window.location.href);

    const handlePopState = () => {
      // If we're allowing this navigation through, skip interception
      if (skipNextPopstate.current) {
        skipNextPopstate.current = false;
        return;
      }

      if (isDirtyRef.current) {
        // User pressed back but form is dirty — push state back and show dialog
        window.history.pushState(null, "", window.location.href);
        setPendingPath("back");
        setShowDialog(true);
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  // Confirm — user wants to leave
  const confirmNavigation = useCallback(() => {
    setShowDialog(false);
    isDirtyRef.current = false; // Prevent re-trigger

    if (pendingPath === "back") {
      // Allow the next popstate through without interception
      skipNextPopstate.current = true;
      router.back();
    } else if (pendingPath) {
      router.push(pendingPath);
    }
    setPendingPath(null);
  }, [pendingPath, router]);

  // Cancel — stay on page
  const cancelNavigation = useCallback(() => {
    setShowDialog(false);
    setPendingPath(null);
  }, []);

  /**
   * navigateAway — safe navigation for back/cancel buttons
   * - If dirty: shows confirmation dialog
   * - If clean: navigates immediately via router.push
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
