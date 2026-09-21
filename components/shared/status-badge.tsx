import type { LucideIcon } from "lucide-react";
import { CheckCircle2, Clock, XCircle, Ban, Circle } from "lucide-react";
import { cn } from "@/lib/utils";

export type StatusTone = "success" | "warning" | "danger" | "info" | "neutral";

export type StatusBadgeProps = {
  tone: StatusTone;
  label: string;
  icon?: LucideIcon;
  className?: string;
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

export function StatusBadge({ tone, label, icon, className }: StatusBadgeProps) {
  const Icon = icon ?? toneIcons[tone];

  return (
    <span
      className={cn(
        "inline-flex h-5 w-fit shrink-0 items-center gap-1 rounded-sm px-2.5 py-1.5 text-xs font-medium whitespace-nowrap",
        toneStyles[tone],
        className
      )}
    >
      <Icon className="size-3 shrink-0" aria-hidden="true" />
      {label}
    </span>
  );
}
