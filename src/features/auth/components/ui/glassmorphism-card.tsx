/**
 * Purpose: Reusable glassmorphism card wrapper
 * Responsibility: Provide consistent premium card styling for auth forms
 */

import { type ReactNode } from "react";

interface GlassmorphismCardProps {
  children: ReactNode;
}

export function GlassmorphismCard({ children }: GlassmorphismCardProps) {
  return (
    <div className="relative backdrop-blur-xl bg-white/70 dark:bg-card/70 rounded-3xl shadow-2xl shadow-rose-500/10 border border-white/50 dark:border-border/50 p-8 overflow-hidden">
      {/* Decorative corners */}
      <div className="absolute -top-1 -right-1 w-20 h-20 bg-gradient-to-bl from-primary/20 to-transparent rounded-bl-3xl" />
      <div className="absolute -bottom-1 -left-1 w-16 h-16 bg-gradient-to-tr from-primary/10 to-transparent rounded-tr-3xl" />
      <div className="relative">{children}</div>
    </div>
  );
}
