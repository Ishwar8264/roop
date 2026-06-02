/**
 * Purpose: Generic navigation link component for both header and bottom nav
 * Responsibility: Render a single navigation link with icon, label, and active state
 * Important Notes:
 *   - Generic — no auth logic, no hardcoded routes
 *   - `variant` prop switches style: "bottom" for mobile, "header" for desktop
 *   - Active state detected by comparing href with current pathname
 *   - 48px minimum touch target for mobile accessibility
 *   - Supports iconName for dynamic icon rendering from translation
 */

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import { Home, Scissors, Calendar, Gift, User, BookOpen, Star, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

// ==================== Icon Map ====================

const ICON_MAP: Record<string, LucideIcon> = {
  Home,
  Scissors,
  Calendar,
  Gift,
  User,
  BookOpen,
  Star,
  Settings,
};

// ==================== Types ====================

export interface NavItem {
  href: string;
  icon: LucideIcon | (() => null);
  label: string;
  /** Alternative label (e.g., for accessibility) */
  labelAlt?: string;
  /** Icon name for dynamic icon resolution */
  iconName?: string;
}

interface NavLinkProps {
  item: NavItem;
  variant?: "bottom" | "header";
  className?: string;
}

// ==================== Component ====================

export function NavLink({ item, variant = "header", className }: NavLinkProps) {
  const pathname = usePathname();

  // Resolve icon: prefer iconName map, fallback to item.icon
  const Icon: LucideIcon = item.iconName
    ? (ICON_MAP[item.iconName] || Home)
    : (item.icon as LucideIcon);

  const isActive =
    pathname === item.href || pathname.startsWith(item.href + "/");

  if (variant === "bottom") {
    return (
      <Link
        href={item.href}
        className={cn(
          "flex flex-col items-center justify-center gap-0.5 min-w-0 flex-1",
          "min-h-[48px] min-w-[48px]",
          "transition-colors duration-200",
          isActive
            ? "text-primary"
            : "text-muted-foreground hover:text-foreground",
          className
        )}
        aria-current={isActive ? "page" : undefined}
        aria-label={item.labelAlt || item.label}
      >
        <Icon className={cn("h-5 w-5", isActive && "fill-primary/20")} />
        <span className="text-[10px] leading-tight font-medium truncate">
          {item.label}
        </span>
      </Link>
    );
  }

  // Header variant — horizontal link
  return (
    <Link
      href={item.href}
      className={cn(
        "flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium",
        "transition-colors duration-200",
        isActive
          ? "text-primary bg-primary/10"
          : "text-muted-foreground hover:text-foreground hover:bg-accent/50",
        className
      )}
      aria-current={isActive ? "page" : undefined}
      aria-label={item.labelAlt || item.label}
    >
      <Icon className="h-4 w-4" />
      <span>{item.label}</span>
    </Link>
  );
}
