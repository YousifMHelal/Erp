import type { LucideIcon } from "lucide-react";
import { CheckCircle2, Clock, XCircle, Ban, Circle } from "lucide-react";
import { cn } from "@/lib/utils";

export type StatusTone = "success" | "warning" | "danger" | "info" | "neutral";

export type StatusBadgeProps = {
  tone: StatusTone;
  label: string;
  icon?: LucideIcon;
  className?: string;
  size?: "default" | "lg";
};

const toneStyles: Record<StatusTone, string> = {
  success: "bg-success-bg text-success-fg",
  warning: "bg-warning-bg text-warning-fg",
  danger: "bg-danger-bg text-danger-fg",
  info: "bg-info-bg text-info-fg",
  neutral: "bg-neutral-bg text-neutral-fg",
};

const toneIcons: Record<StatusTone, LucideIcon> = {
  success: CheckCircle2,
  warning: Clock,
  danger: XCircle,
  info: Circle,
  neutral: Ban,
};

export function StatusBadge({ tone, label, icon, className, size = "default" }: StatusBadgeProps) {
  const Icon = icon ?? toneIcons[tone];

  return (
    <span
      className={cn(
        "inline-flex w-fit shrink-0 items-center gap-1 rounded-sm font-medium whitespace-nowrap",
        size === "lg" ? "gap-2 rounded-md px-4 py-2 text-h3" : "h-5 px-2.5 py-1.5 text-xs",
        toneStyles[tone],
        className
      )}
    >
      <Icon className={size === "lg" ? "size-5 shrink-0" : "size-3 shrink-0"} aria-hidden="true" />
      {label}
    </span>
  );
}
