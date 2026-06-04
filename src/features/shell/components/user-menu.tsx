/**
 * Purpose: Desktop user dropdown menu
 * Responsibility: Show user avatar, name, and action links in a dropdown
 * Important Notes:
 *   - Uses shadcn DropdownMenu
 *   - Reads user from useAuthStore
 *   - Generic menu items — easy to add/remove links
 *   - Renders on both mobile and desktop (AppHeader controls visibility)
 *   - Uses i18n for labels
 */

"use client";

import { useRouter } from "next/navigation";
import {
  User,
  Calendar,
  Star,
  LogOut,
  Settings,
  ChevronDown,
  ShieldAlert,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuthStore } from "@/stores/auth-store";
import { apiClient } from "@/services/api-client";
import { useTranslation } from "@/i18n/use-translation";

// ==================== Component ====================

export function UserMenu() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const { t } = useTranslation();

  const handleLogout = async () => {
    try {
      await apiClient.post("/auth/logout");
    } catch {
      // Ignore — clear local state anyway
    }
    logout();
    router.push("/");
  };

  if (!user) return null;

  const initials = (
    user.name?.charAt(0) || user.email?.charAt(0) || "U"
  ).toUpperCase();

  // Menu items with i18n — admin gets extra link
  const userMenuItems = [
    ...(user.role === "ADMIN"
      ? [{ href: "/admin/dashboard", icon: ShieldAlert, label: t("admin.badge") + " Panel" }]
      : []),
    { href: "/profile", icon: User, label: t("userMenu.profile") },
    { href: "/bookings", icon: Calendar, label: t("userMenu.myBookings") },
    { href: "/loyalty", icon: Star, label: t("userMenu.loyaltyPoints") },
    { href: "/profile/settings", icon: Settings, label: t("userMenu.settings") },
  ];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex items-center gap-2 rounded-full px-2 py-1.5 hover:bg-accent/50 transition-colors"
        >
          <Avatar className="h-8 w-8">
            <AvatarImage src={user.avatarUrl || undefined} alt={user.name || ""} />
            <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <span className="text-sm font-medium max-w-[100px] truncate hidden xl:inline">
            {user.name || user.mobile || user.email}
          </span>
          <ChevronDown className="h-3 w-3 text-muted-foreground" />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-48">
        <div className="px-2 py-1.5">
          <p className="text-sm font-medium truncate">
            {user.name || t("userMenu.user")}
          </p>
          <p className="text-xs text-muted-foreground truncate">
            {user.email || user.mobile}
          </p>
        </div>

        <DropdownMenuSeparator />

        {userMenuItems.map((item) => (
          <DropdownMenuItem
            key={item.href}
            onClick={() => router.push(item.href)}
            className="cursor-pointer"
          >
            <item.icon className="h-4 w-4 mr-2" />
            {item.label}
          </DropdownMenuItem>
        ))}

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={handleLogout}
          className="cursor-pointer text-destructive focus:text-destructive"
        >
          <LogOut className="h-4 w-4 mr-2" />
          {t("userMenu.logout")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
