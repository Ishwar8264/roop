/**
 * Purpose: Shared navigation items configuration
 * Responsibility: Define all nav items in one place for reuse
 * Important Notes:
 *   - Used by AppHeader (desktop nav + mobile drawer)
 *   - Used by BottomNav (mobile bottom tabs)
 *   - Icons are referenced by name for dynamic resolution
 *   - Labels are set dynamically via i18n
 */

import type { LucideIcon } from "lucide-react";
import { Home, Scissors, Calendar, Gift, User, BookOpen, Settings, MapPin } from "lucide-react";

export interface NavItemConfig {
  href: string;
  icon: LucideIcon;
  iconName: string;
  /** Function to get label from translations */
  labelKey: string;
}

// All nav items — used by both header and bottom nav
export const allNavItems: NavItemConfig[] = [
  {
    href: "/dashboard",
    icon: Home,
    iconName: "Home",
    labelKey: "nav.home",
  },
  {
    href: "/services",
    icon: Scissors,
    iconName: "Scissors",
    labelKey: "nav.services",
  },
  {
    href: "/bookings",
    icon: Calendar,
    iconName: "Calendar",
    labelKey: "nav.bookings",
  },
  {
    href: "/offers",
    icon: Gift,
    iconName: "Gift",
    labelKey: "nav.offers",
  },
  {
    href: "/branches",
    icon: MapPin,
    iconName: "MapPin",
    labelKey: "nav.branches",
  },
  {
    href: "/blog",
    icon: BookOpen,
    iconName: "BookOpen",
    labelKey: "nav.blog",
  },
  {
    href: "/profile",
    icon: User,
    iconName: "User",
    labelKey: "nav.profile",
  },
  {
    href: "/settings",
    icon: Settings,
    iconName: "Settings",
    labelKey: "nav.settings",
  },
];

// Bottom nav items — subset (5 items for mobile)
export const bottomNavItemHrefs = [
  "/dashboard",
  "/services",
  "/bookings",
  "/offers",
  "/settings",
];

// Header-only items (not shown in bottom nav on mobile)
const _headerOnlyHrefs = ["/branches", "/blog", "/profile"];
