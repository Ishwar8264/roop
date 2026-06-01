/**
 * Purpose: Mobile bottom navigation bar
 * Responsibility: Render fixed bottom navigation with 5 tabs for mobile/tablet
 * Important Notes:
 *   - Renders ONLY on mobile/tablet (md:hidden in parent)
 *   - Uses generic NavItem[] config — no hardcoded routes inside component
 *   - Safe area support for iPhone notch (pb-safe)
 *   - Active tab highlighted with primary color
 *   - Fixed to bottom, content gets padding-bottom to avoid overlap
 */

"use client";

import { Home, Scissors, Calendar, Gift, User } from "lucide-react";
import { NavLink, type NavItem } from "./nav-link";

// ==================== Nav Items Config ====================

const bottomNavItems: NavItem[] = [
  {
    href: "/dashboard",
    icon: Home,
    label: "होम",
    labelEn: "Home",
  },
  {
    href: "/services",
    icon: Scissors,
    label: "सेवाएं",
    labelEn: "Services",
  },
  {
    href: "/bookings",
    icon: Calendar,
    label: "बुकिंग",
    labelEn: "Bookings",
  },
  {
    href: "/offers",
    icon: Gift,
    label: "ऑफ़र",
    labelEn: "Offers",
  },
  {
    href: "/profile",
    icon: User,
    label: "प्रोफ़ाइल",
    labelEn: "Profile",
  },
];

// ==================== Component ====================

export function BottomNav() {
  return (
    <nav
      role="navigation"
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

/**
 * Export bottom nav items so other components (like AppHeader) can reuse
 */
export { bottomNavItems };
