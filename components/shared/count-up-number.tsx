"use client";

import { useCountUp } from "@/hooks/use-count-up";
import { formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";

export type CountUpNumberProps = { value: number; className?: string };

export function CountUpNumber({ value, className }: CountUpNumberProps) {
  const animated = useCountUp(value);
  return <span className={cn("tabular-nums", className)}>{formatNumber(Math.round(animated), 0)}</span>;
}
