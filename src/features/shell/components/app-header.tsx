/**
 * Purpose: Responsive top header for the app
 * Responsibility: Render mobile thin header and desktop full navbar
 * Important Notes:
 *   - Mobile (< lg): thin header with hamburger menu + brand + avatar
 *   - Desktop (>= lg): full header with nav links inline + user dropdown
 *   - Uses NavLink for desktop nav links
 *   - Uses UserMenu for user dropdown
 *   - Mobile uses Sheet (slide-out drawer) for navigation
 *   - Sticky top with backdrop blur
 */

"use client";

import Link from "next/link";
import { Menu, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from "@/components/ui/sheet";
import { NavLink, type NavItem } from "./nav-link";
import { UserMenu } from "./user-menu";
import { bottomNavItems } from "./bottom-nav";

// ==================== Desktop Extra Nav Items ====================

const desktopOnlyItems: NavItem[] = [
  {
    href: "/blog",
    icon: BookOpen,
    label: "ब्लॉग",
    labelEn: "Blog",
  },
];

// ==================== Component ====================

export function AppHeader() {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-6xl mx-auto px-4">
        {/* ===== Mobile Header (< lg) ===== */}
        <div className="flex lg:hidden items-center justify-between h-14">
          <MobileMenuButton />

          <Link href="/dashboard" className="font-bold text-primary text-lg">
            निखरता रूप
          </Link>

          <UserMenu />
        </div>

        {/* ===== Desktop Header (>= lg) ===== */}
        <div className="hidden lg:flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
            <Link href="/dashboard" className="font-bold text-primary text-xl">
              निखरता रूप
            </Link>

            <nav className="flex items-center gap-1" aria-label="Main navigation">
              {bottomNavItems.map((item) => (
                <NavLink key={item.href} item={item} variant="header" />
              ))}
              {desktopOnlyItems.map((item) => (
                <NavLink key={item.href} item={item} variant="header" />
              ))}
            </nav>
          </div>

          <UserMenu />
        </div>
      </div>
    </header>
  );
}

// ==================== Mobile Menu ====================

function MobileMenuButton() {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="h-9 w-9">
          <Menu className="h-5 w-5" />
          <span className="sr-only">मेनू खोलें</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72 p-0">
        <SheetTitle className="px-4 pt-4 pb-2 text-primary font-bold text-lg border-b">
          निखरता रूप
        </SheetTitle>
        <nav className="flex flex-col p-2">
          {bottomNavItems.map((item) => (
            <NavLink
              key={item.href}
              item={item}
              variant="header"
              className="w-full justify-start"
            />
          ))}
          {desktopOnlyItems.map((item) => (
            <NavLink
              key={item.href}
              item={item}
              variant="header"
              className="w-full justify-start"
            />
          ))}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
