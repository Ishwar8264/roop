/**
 * @file Glassmorphism card — premium frosted-glass container
 *
 * PURPOSE: Premium card wrapper with backdrop blur, semi-transparent bg,
 * subtle rose shadow, and decorative gradient corners.
 * Works in both light and dark mode.
 */

import { type ReactNode } from "react";

interface GlassmorphismCardProps {
  children: ReactNode;
}

export function GlassmorphismCard({ children }: GlassmorphismCardProps) {
  return (
    <div className="relative w-full rounded-3xl p-8 overflow-hidden
      backdrop-blur-xl
      bg-white/80 dark:bg-zinc-900/80
      border border-white/60 dark:border-zinc-700/50
      shadow-2xl shadow-rose-500/10 dark:shadow-rose-500/5
    ">
      {/* Decorative top-right corner */}
      <div className="absolute -top-1 -right-1 w-24 h-24 bg-gradient-to-bl from-rose-400/20 to-transparent rounded-bl-3xl pointer-events-none" />
      {/* Decorative bottom-left corner */}
      <div className="absolute -bottom-1 -left-1 w-20 h-20 bg-gradient-to-tr from-pink-400/15 to-transparent rounded-tr-3xl pointer-events-none" />
      {/* Content */}
      <div className="relative">{children}</div>
    </div>
  );
}
