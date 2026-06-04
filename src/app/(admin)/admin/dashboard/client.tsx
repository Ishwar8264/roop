/**
 * Purpose: Admin Dashboard client component
 * Responsibility: Display overview stats cards + quick action links
 */

"use client";

import Link from "next/link";
import {
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
  ArrowRight,
  ShieldAlert,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuthStore } from "@/stores/auth-store";
import { useTranslation } from "@/i18n/use-translation";

interface AdminStatCard {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  labelKey: string;
  descKey: string;
  wired: boolean;
  color: string;
}

const statCards: AdminStatCard[] = [
  { href: "/admin/bookings", icon: Calendar, labelKey: "admin.nav.bookings", descKey: "admin.desc.bookings", wired: true, color: "text-blue-600 bg-blue-100 dark:bg-blue-900/30" },
  { href: "/admin/services", icon: Scissors, labelKey: "admin.nav.services", descKey: "admin.desc.services", wired: true, color: "text-pink-600 bg-pink-100 dark:bg-pink-900/30" },
  { href: "/admin/branches", icon: MapPin, labelKey: "admin.nav.branches", descKey: "admin.desc.branches", wired: true, color: "text-green-600 bg-green-100 dark:bg-green-900/30" },
  { href: "/admin/staff", icon: Users, labelKey: "admin.nav.staff", descKey: "admin.desc.staff", wired: true, color: "text-violet-600 bg-violet-100 dark:bg-violet-900/30" },
  { href: "/admin/offers", icon: Gift, labelKey: "admin.nav.offers", descKey: "admin.desc.offers", wired: true, color: "text-orange-600 bg-orange-100 dark:bg-orange-900/30" },
  { href: "/admin/payments", icon: CreditCard, labelKey: "admin.nav.payments", descKey: "admin.desc.payments", wired: true, color: "text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30" },
  { href: "/admin/reviews", icon: Star, labelKey: "admin.nav.reviews", descKey: "admin.desc.reviews", wired: true, color: "text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30" },
  { href: "/admin/revenue", icon: DollarSign, labelKey: "admin.nav.revenue", descKey: "admin.desc.revenue", wired: false, color: "text-green-600 bg-green-100 dark:bg-green-900/30" },
  { href: "/admin/expenses", icon: Receipt, labelKey: "admin.nav.expenses", descKey: "admin.desc.expenses", wired: false, color: "text-red-600 bg-red-100 dark:bg-red-900/30" },
  { href: "/admin/commissions", icon: Percent, labelKey: "admin.nav.commissions", descKey: "admin.desc.commissions", wired: false, color: "text-purple-600 bg-purple-100 dark:bg-purple-900/30" },
  { href: "/admin/products", icon: ShoppingBag, labelKey: "admin.nav.products", descKey: "admin.desc.products", wired: false, color: "text-cyan-600 bg-cyan-100 dark:bg-cyan-900/30" },
  { href: "/admin/inventory", icon: Package, labelKey: "admin.nav.inventory", descKey: "admin.desc.inventory", wired: false, color: "text-amber-600 bg-amber-100 dark:bg-amber-900/30" },
  { href: "/admin/users", icon: UserCog, labelKey: "admin.nav.users", descKey: "admin.desc.users", wired: false, color: "text-indigo-600 bg-indigo-100 dark:bg-indigo-900/30" },
  { href: "/admin/notifications", icon: Bell, labelKey: "admin.nav.notifications", descKey: "admin.desc.notifications", wired: false, color: "text-sky-600 bg-sky-100 dark:bg-sky-900/30" },
  { href: "/admin/analytics", icon: BarChart3, labelKey: "admin.nav.analytics", descKey: "admin.desc.analytics", wired: false, color: "text-teal-600 bg-teal-100 dark:bg-teal-900/30" },
  { href: "/admin/blog", icon: BookOpen, labelKey: "admin.nav.blog", descKey: "admin.desc.blog", wired: false, color: "text-rose-600 bg-rose-100 dark:bg-rose-900/30" },
  { href: "/admin/consultations", icon: Stethoscope, labelKey: "admin.nav.consultations", descKey: "admin.desc.consultations", wired: false, color: "text-fuchsia-600 bg-fuchsia-100 dark:bg-fuchsia-900/30" },
  { href: "/admin/loyalty", icon: Heart, labelKey: "admin.nav.loyalty", descKey: "admin.desc.loyalty", wired: false, color: "text-pink-600 bg-pink-100 dark:bg-pink-900/30" },
];

export function AdminDashboardClient() {
  const { user } = useAuthStore();
  const { t } = useTranslation();

  const wiredCards = statCards.filter((c) => c.wired);
  const unwiredCards = statCards.filter((c) => !c.wired);

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <ShieldAlert className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-bold">{t("admin.dashboard.welcome")}{user?.name ? `, ${user.name}` : ""}!</h2>
        </div>
        <p className="text-muted-foreground mt-1">{t("admin.dashboard.subtitle")}</p>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-3">{t("admin.dashboard.activeFeatures")}</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {wiredCards.map((card) => (
            <Link key={card.href} href={card.href}>
              <Card className="cursor-pointer hover:shadow-md hover:border-primary/30 transition-all h-full">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div className={`inline-flex items-center justify-center w-10 h-10 rounded-lg ${card.color}`}>
                      <card.icon className="h-5 w-5" />
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <h4 className="font-semibold mt-3">{t(card.labelKey)}</h4>
                  <p className="text-xs text-muted-foreground mt-1">{t(card.descKey)}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-3">{t("admin.dashboard.comingSoonFeatures")}</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {unwiredCards.map((card) => (
            <Link key={card.href} href={card.href}>
              <Card className="cursor-pointer hover:shadow-md transition-all h-full opacity-75 hover:opacity-100">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div className={`inline-flex items-center justify-center w-10 h-10 rounded-lg ${card.color}`}>
                      <card.icon className="h-5 w-5" />
                    </div>
                    <Badge variant="secondary" className="text-[10px] bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                      {t("admin.comingSoonBadge")}
                    </Badge>
                  </div>
                  <h4 className="font-semibold mt-3">{t(card.labelKey)}</h4>
                  <p className="text-xs text-muted-foreground mt-1">{t(card.descKey)}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
