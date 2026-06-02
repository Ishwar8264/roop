"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner, ToasterProps } from "sonner"

/**
 * Custom Toaster that respects dark/light/system theme
 *
 * Key design decisions:
 * - Uses sonner's built-in theme prop for dark mode support
 * - richColors lets sonner style success/error/warning automatically per theme
 * - closeButton with proper positioning
 * - Base styles use CSS variables (popover, border) so they adapt to theme
 * - No hardcoded HSL values — sonner handles color theming internally
 * - Only override structural styles (border-radius, shadows, padding)
 */
const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      closeButton
      duration={5000}
      position="top-right"
      richColors
      toastOptions={{
        classNames: {
          toast: "group pr-8 !font-sans",
          title: "!font-semibold !text-sm",
          description: "!text-xs !opacity-80",
          closeButton: "!right-1 !top-1/2 !-translate-y-1/2 !left-auto !rounded-md !h-6 !w-6",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
