/**
 * Purpose: Centralized unsaved changes guard hook
 * Responsibility: Detect dirty forms and prevent navigation with confirmation dialog
 * Important Notes:
 *   - Works with react-hook-form's formState.isDirty
 *   - Intercepts: browser back/forward, cancel/back button clicks, sidebar link clicks
 *   - Shows AlertDialog: "You have unsaved changes. Leave anyway?"
 *   - Uses router.push(returnUrl) for confirmed navigation (avoids duplicate history issues)
 *   - Blocks browser beforeunload for tab/window close
 *   - Provides navigateAway(path) for cancel/back buttons
 *   - Provides markClean() for submit handlers to call before mutation
 *   - After successful submit, caller should call markClean() then router.push(successUrl)
 *   - Module-level exports (isNavigationBlocked, requestNavigation) for GuardedLink integration
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

// ==================== Module-level state for GuardedLink ====================
// Since only one form can be dirty at a time, module-level state is safe.

let _isDirty = false;
let _navigateAwayFn: ((path: string) => void) | null = null;

/** Check if navigation is currently blocked by a dirty form */
export function isNavigationBlocked(): boolean {
  return _isDirty;
}

/**
 * Request navigation to a path — shows dialog if blocked.
 * Returns true if navigation was allowed, false if blocked (dialog shown).
 */
export function requestNavigation(path: string): boolean {
  if (_isDirty && _navigateAwayFn) {
    _navigateAwayFn(path);
    return false;
  }
  return true;
}

// ==================== Hook Options ====================

interface UseUnsavedChangesOptions {
  /** Whether the form has unsaved changes */
  isDirty: boolean;
  /** Where to navigate when user confirms leaving (used for browser back interception) */
  returnUrl: string;
}

// ==================== Hook ====================

export function useUnsavedChanges({ isDirty, returnUrl }: UseUnsavedChangesOptions) {
  const router = useRouter();
  const { t } = useTranslation();
  const [showDialog, setShowDialog] = useState(false);
  const [pendingPath, setPendingPath] = useState<string | null>(null);

  // Refs to avoid stale closures in event handlers
  const isDirtyRef = useRef(isDirty);
  const returnUrlRef = useRef(returnUrl);

  // Keep refs in sync with props
  useEffect(() => {
    isDirtyRef.current = isDirty;
    _isDirty = isDirty;
  }, [isDirty]);

  useEffect(() => {
    returnUrlRef.current = returnUrl;
  }, [returnUrl]);

  // ─── Block browser tab/window close ───

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

  // ─── Intercept browser back/forward via popstate ───
  // Strategy: Push an extra history entry on mount. When popstate fires
  // (user pressed back), push the entry back and show dialog. On confirm,
  // navigate directly to returnUrl using router.push (avoids the broken
  // router.back() with duplicate entries issue).

  useEffect(() => {
    // Push an extra entry so we can intercept the first back navigation
    window.history.pushState(null, "", window.location.href);

    const handlePopState = () => {
      if (isDirtyRef.current) {
        // Push state back to prevent actual navigation away
        window.history.pushState(null, "", window.location.href);
        // Use returnUrl as the pending destination (we know where to go)
        setPendingPath(returnUrlRef.current);
        setShowDialog(true);
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  // ─── Dialog actions ───

  // Confirm — user wants to leave despite unsaved changes
  const confirmNavigation = useCallback(() => {
    setShowDialog(false);
    isDirtyRef.current = false;
    _isDirty = false;

    if (pendingPath) {
      // Use router.push to a known URL instead of router.back()
      // This avoids issues with duplicate history entries from pushState
      router.push(pendingPath);
    }
    setPendingPath(null);
  }, [pendingPath, router]);

  // Cancel — stay on the page
  const cancelNavigation = useCallback(() => {
    setShowDialog(false);
    setPendingPath(null);
  }, []);

  /**
   * navigateAway — safe navigation for cancel/back buttons in forms
   * - If dirty: shows confirmation dialog with the target path
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

  // Keep module-level navigateAway ref in sync
  useEffect(() => {
    _navigateAwayFn = navigateAway;
    return () => {
      _navigateAwayFn = null;
    };
  }, [navigateAway]);

  /**
   * markClean — mark the form as clean to prevent guard from blocking
   * Called by form submit handlers BEFORE the mutation starts, so that
   * the post-submit router.push doesn't accidentally trigger the guard.
   */
  const markClean = useCallback(() => {
    isDirtyRef.current = false;
    _isDirty = false;
  }, []);

  // ─── Confirmation Dialog Component ───

  const UnsavedChangesDialog = () => (
    <AlertDialog
      open={showDialog}
      onOpenChange={(open) => {
        if (!open) cancelNavigation();
      }}
    >
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
    markClean,
    isGuarding: isDirty,
  };
}
