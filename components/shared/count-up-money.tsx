"use client";

import { useCountUp } from "@/hooks/use-count-up";
import { formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";

export type CountUpMoneyProps = { value: number; className?: string };

export function CountUpMoney({ value, className }: CountUpMoneyProps) {
  const animated = useCountUp(value);
  return <span className={cn("tabular-nums", className)}>{formatMoney(animated.toString())}</span>;
}
