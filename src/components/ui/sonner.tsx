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
        } as React.CSSProperties
      }
      closeButton
      duration={4000}
      position="top-right"
      richColors
      toastOptions={{
        classNames: {
          toast: "group pr-8",
          closeButton: "!right-1 !top-1/2 !-translate-y-1/2 !left-auto !border-border hover:!bg-accent",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
