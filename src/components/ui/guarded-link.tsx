/**
 * Purpose: Link component that respects the unsaved changes guard
 * Responsibility: Intercept navigation when a form is dirty and show confirmation dialog
 * Important Notes:
 *   - Drop-in replacement for Next.js Link in navigation contexts (sidebar, etc.)
 *   - Uses module-level isNavigationBlocked() and requestNavigation() from use-unsaved-changes
 *   - If form is dirty, prevents navigation and triggers the guard dialog
 *   - If form is clean, navigates normally
 */

"use client";

import Link from "next/link";
import type { ComponentProps } from "react";
import { isNavigationBlocked, requestNavigation } from "@/hooks/use-unsaved-changes";

export function GuardedLink({
  href,
  onClick,
  ...props
}: ComponentProps<typeof Link>) {
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (isNavigationBlocked()) {
      e.preventDefault();
      requestNavigation(href.toString());
      return;
    }
    // If not blocked, allow normal navigation + any custom onClick
    onClick?.(e);
  };

  return <Link href={href} onClick={handleClick} {...props} />;
}
