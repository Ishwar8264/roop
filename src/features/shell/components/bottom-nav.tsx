/**
 * Purpose: Mobile bottom navigation bar
 * Responsibility: Render fixed bottom navigation with 5 tabs for mobile/tablet
 * Important Notes:
 *   - Renders ONLY on mobile/tablet (md:hidden in parent)
 *   - Uses shared nav-config for items (subset of allNavItems)
 *   - Safe area support for iPhone notch (pb-safe)
 *   - Active tab highlighted with primary color
 *   - Fixed to bottom, content gets padding-bottom to avoid overlap
 *   - Uses i18n for labels
 */

"use client";

import { NavLink, type NavItem } from "./nav-link";
import { useTranslation } from "@/i18n/use-translation";
import { allNavItems, bottomNavItemHrefs } from "./nav-config";

// ==================== Component ====================

export function BottomNav() {
  const { t } = useTranslation();

  // Bottom nav items — subset (5 items for mobile, no Blog)
  const bottomNavItems: NavItem[] = allNavItems.reduce<NavItem[]>((acc, item) => {
    if (bottomNavItemHrefs.includes(item.href)) {
      acc.push({
        href: item.href,
        icon: item.icon,
        label: t(item.labelKey),
        iconName: item.iconName,
      });
    }
    return acc;
  }, []);

  return (
    <nav
      aria-label="Mobile navigation"
      className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
    >
      <div className="flex items-center h-16 px-2 max-w-lg mx-auto">
        {bottomNavItems.map((item) => (
          <NavLink key={item.href} item={item} variant="bottom" />
        ))}
      </div>

      {/* Safe area for iPhone notch */}
      <div className="h-[env(safe-area-inset-bottom)]" />
    </nav>
  );
}

// Re-export for backward compatibility
export { bottomNavItemHrefs as bottomNavItems };
