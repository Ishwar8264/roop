"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner, ToasterProps } from "sonner"
import { X } from "lucide-react"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--success-bg": "hsl(143 85% 96%)",
          "--success-text": "hsl(140 100% 27%)",
          "--success-border": "hsl(145 92% 80%)",
          "--error-bg": "hsl(359 100% 97%)",
          "--error-text": "hsl(359 100% 65%)",
          "--error-border": "hsl(359 100% 90%)",
          "--warning-bg": "hsl(49 100% 97%)",
          "--warning-text": "hsl(31 92% 45%)",
          "--warning-border": "hsl(49 100% 85%)",
        } as React.CSSProperties
      }
      closeButton
      duration={5000}
      position="top-right"
      richColors
      toastOptions={{
        classNames: {
          toast: "group pr-8 !rounded-lg !shadow-lg !border",
          title: "!font-semibold !text-sm",
          description: "!text-xs !opacity-80",
          closeButton: "!right-1 !top-1/2 !-translate-y-1/2 !left-auto !border-border hover:!bg-accent !rounded-md !h-6 !w-6",
          success: "!bg-[var(--success-bg)] !text-[var(--success-text)] !border-[var(--success-border)] dark:!bg-green-950/30 dark:!text-green-400 dark:!border-green-900/50",
          error: "!bg-[var(--error-bg)] !text-[var(--error-text)] !border-[var(--error-border)] dark:!bg-red-950/30 dark:!text-red-400 dark:!border-red-900/50",
          warning: "!bg-[var(--warning-bg)] !text-[var(--warning-text)] !border-[var(--warning-border)] dark:!bg-yellow-950/30 dark:!text-yellow-400 dark:!border-yellow-900/50",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
