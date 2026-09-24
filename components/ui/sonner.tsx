"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner, type ToasterProps } from "sonner"
import { CircleCheckIcon, InfoIcon, TriangleAlertIcon, OctagonXIcon, Loader2Icon } from "lucide-react"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      icons={{
        success: (
          <CircleCheckIcon className="size-4" />
        ),
        info: (
          <InfoIcon className="size-4" />
        ),
        warning: (
          <TriangleAlertIcon className="size-4" />
        ),
        error: (
          <OctagonXIcon className="size-4" />
        ),
        loading: (
          <Loader2Icon className="size-4 animate-spin" />
        ),
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "var(--radius)",
        } as React.CSSProperties
      }
      toastOptions={{
        duration: 3000,
        classNames: {
          toast: "cn-toast shadow-elevation-lg border-s-4 border-s-border",
          success: "!border-s-success-fg [&_[data-icon]]:text-success-fg",
          error: "!border-s-danger-fg [&_[data-icon]]:text-danger-fg",
          warning: "!border-s-warning-fg [&_[data-icon]]:text-warning-fg",
          info: "!border-s-info-fg [&_[data-icon]]:text-info-fg",
          title: "text-body font-medium",
          description: "text-body-sm text-muted-foreground",
          actionButton: "!bg-accent !text-accent-foreground",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
