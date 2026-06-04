/**
 * Purpose: Admin sidebar navigation component
 * Responsibility: Render all admin nav items with sections
 * Important Notes:
 *   - Desktop: collapsible sidebar (icon-only mode)
 *   - Mobile: used inside a Sheet from admin-shell
 *   - Active item highlighted with primary color
 *   - "Coming Soon" badge for unwired features
 */

"use client";

import { GuardedLink } from "@/components/ui/guarded-link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Calendar,
  Scissors,
  MapPin,
  Users,
  Gift,
  CreditCard,
  Star,
  DollarSign,
  Receipt,
  Percent,
  Package,
  ShoppingBag,
  UserCog,
  Bell,
  BarChart3,
  BookOpen,
  Stethoscope,
  Heart,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/i18n/use-translation";

// ==================== Admin Nav Config ====================

export interface AdminNavItem {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  labelKey: string;
  wired: boolean;
}

export const adminNavSections: { titleKey: string; items: AdminNavItem[] }[] = [
  {
    titleKey: "admin.nav.overview",
    items: [
      { href: "/admin/dashboard", icon: LayoutDashboard, labelKey: "admin.nav.dashboard", wired: true },
      { href: "/admin/analytics", icon: BarChart3, labelKey: "admin.nav.analytics", wired: false },
    ],
  },
  {
    titleKey: "admin.nav.operations",
    items: [
      { href: "/admin/bookings", icon: Calendar, labelKey: "admin.nav.bookings", wired: true },
      { href: "/admin/services", icon: Scissors, labelKey: "admin.nav.services", wired: true },
      { href: "/admin/branches", icon: MapPin, labelKey: "admin.nav.branches", wired: true },
      { href: "/admin/staff", icon: Users, labelKey: "admin.nav.staff", wired: true },
      { href: "/admin/offers", icon: Gift, labelKey: "admin.nav.offers", wired: true },
      { href: "/admin/payments", icon: CreditCard, labelKey: "admin.nav.payments", wired: true },
      { href: "/admin/reviews", icon: Star, labelKey: "admin.nav.reviews", wired: true },
    ],
  },
  {
    titleKey: "admin.nav.finance",
    items: [
      { href: "/admin/revenue", icon: DollarSign, labelKey: "admin.nav.revenue", wired: false },
      { href: "/admin/expenses", icon: Receipt, labelKey: "admin.nav.expenses", wired: false },
      { href: "/admin/commissions", icon: Percent, labelKey: "admin.nav.commissions", wired: false },
    ],
  },
  {
    titleKey: "admin.nav.inventory",
    items: [
      { href: "/admin/products", icon: ShoppingBag, labelKey: "admin.nav.products", wired: false },
      { href: "/admin/inventory", icon: Package, labelKey: "admin.nav.inventory", wired: false },
    ],
  },
  {
    titleKey: "admin.nav.management",
    items: [
      { href: "/admin/users", icon: UserCog, labelKey: "admin.nav.users", wired: false },
      { href: "/admin/notifications", icon: Bell, labelKey: "admin.nav.notifications", wired: false },
      { href: "/admin/blog", icon: BookOpen, labelKey: "admin.nav.blog", wired: false },
      { href: "/admin/consultations", icon: Stethoscope, labelKey: "admin.nav.consultations", wired: false },
      { href: "/admin/loyalty", icon: Heart, labelKey: "admin.nav.loyalty", wired: false },
    ],
  },
];

// ==================== Nav Items Renderer ====================

function NavItems({ collapsed, onItemClick }: { collapsed?: boolean; onItemClick?: () => void }) {
  const pathname = usePathname();
  const { t } = useTranslation();

  return (
    <ScrollArea className="flex-1">
      {adminNavSections.map((section) => (
        <div key={section.titleKey} className="mb-2">
          {!collapsed && (
            <p className="px-4 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {t(section.titleKey)}
            </p>
          )}
          {collapsed && <Separator className="mx-3 my-1" />}
          {section.items.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <GuardedLink
                key={item.href}
                href={item.href}
                onClick={onItemClick}
                className={cn(
                  "flex items-center gap-3 mx-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                )}
                title={collapsed ? t(item.labelKey) : undefined}
              >
                <item.icon className="h-5 w-5 flex-shrink-0" />
                {!collapsed && <span className="truncate">{t(item.labelKey)}</span>}
                {!collapsed && !item.wired && (
                  <span className="ml-auto text-[10px] font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 px-1.5 py-0.5 rounded">
                    {t("admin.comingSoonBadge")}
                  </span>
                )}
              </GuardedLink>
            );
          })}
        </div>
      ))}
    </ScrollArea>
  );
}

// ==================== Desktop Sidebar ====================

export function AdminDesktopSidebar({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
  const { t } = useTranslation();

  return (
    <aside
      className={cn(
        "hidden lg:flex flex-col border-r bg-card transition-all duration-300 h-screen sticky top-0",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Header */}
      <div className={cn("flex items-center border-b h-16 px-4", collapsed ? "justify-center" : "justify-between")}>
        {!collapsed && (
          <GuardedLink href="/admin/dashboard" className="flex items-center gap-2">
            <img src="/logo.png" alt="Nikharta Roop" className="h-8 w-8 rounded-lg object-contain" />
            <span className="font-bold text-primary text-lg">{t("appNameHi")}</span>
          </GuardedLink>
        )}
        {collapsed && (
          <GuardedLink href="/admin/dashboard">
            <img src="/logo.png" alt="Nikharta Roop" className="h-8 w-8 rounded-lg object-contain" />
          </GuardedLink>
        )}
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onToggle}>
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>

      {/* Nav Items */}
      <NavItems collapsed={collapsed} />

      {/* Back to App */}
      <div className="border-t p-2">
        <GuardedLink
          href="/dashboard"
          className={cn(
            "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-colors",
            collapsed && "justify-center"
          )}
        >
          <ArrowLeft className="h-5 w-5 flex-shrink-0" />
          {!collapsed && <span>{t("admin.backToApp")}</span>}
        </GuardedLink>
      </div>
    </aside>
  );
}

// ==================== Mobile Sidebar Content ====================

export function AdminMobileSidebarContent({ onItemClick }: { onItemClick: () => void }) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 pt-4 pb-2 border-b flex items-center gap-2">
        <img src="/logo.png" alt="Nikharta Roop" className="h-7 w-7 rounded-lg object-contain" />
        <span className="text-primary font-bold text-lg">{t("appNameHi")}</span>
      </div>

      {/* Nav Items */}
      <NavItems onItemClick={onItemClick} />

      {/* Back to App */}
      <div className="border-t p-2">
        <GuardedLink
          href="/dashboard"
          onClick={onItemClick}
          className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
          <span>{t("admin.backToApp")}</span>
        </GuardedLink>
      </div>
    </div>
  );
}
