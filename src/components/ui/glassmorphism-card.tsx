/**
 * @file Glassmorphism card wrapper — reusable across the entire app
 *
 * PURPOSE:
 *   Provides a premium glass-like card container with:
 *   - Backdrop blur for the frosted-glass effect
 *   - Semi-transparent background (light/dark mode aware)
 *   - Decorative gradient corners for visual flair
 *   - Rose-tinted shadow for the salon brand feel
 *
 * WHY NOT JUST A <div>?
 *   The glassmorphism effect requires multiple CSS properties working together:
 *   backdrop-blur, semi-transparent bg, border, shadow, and decorative corners.
 *   Wrapping this in a component ensures consistency wherever cards are used.
 *
 * REUSABILITY:
 *   Currently used for auth forms, but can wrap any content:
 *   booking cards, profile sections, dashboard panels, etc.
 */

import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface GlassmorphismCardProps {
  /** Content to render inside the card */
  children: ReactNode;
  /** Additional CSS classes to apply to the outer container */
  className?: string;
}

export function GlassmorphismCard({ children, className }: GlassmorphismCardProps) {
  return (
    <div className={cn("relative backdrop-blur-xl bg-white/70 dark:bg-card/70 rounded-3xl shadow-2xl shadow-rose-500/10 border border-white/50 dark:border-border/50 p-8 overflow-hidden", className)}>
      {/* Decorative top-right gradient corner */}
      <div className="absolute -top-1 -right-1 w-20 h-20 bg-gradient-to-bl from-primary/20 to-transparent rounded-bl-3xl" />
      {/* Decorative bottom-left gradient corner */}
      <div className="absolute -bottom-1 -left-1 w-16 h-16 bg-gradient-to-tr from-primary/10 to-transparent rounded-tr-3xl" />
      {/* Actual content sits above decorative corners */}
      <div className="relative">{children}</div>
    </div>
  );
}
