import type { Prisma } from "@prisma/client";
import { cn } from "@/lib/utils";
import { formatMoney } from "@/lib/format";

export type MoneyProps = {
  value: Prisma.Decimal | string | number;
  className?: string;
  sign?: boolean;
};

export function Money({ value, className, sign = false }: MoneyProps) {
  const decimalValue =
    typeof value === "number" ? value.toString() : value;
  const formatted = formatMoney(decimalValue);
  const isNegative = formatted.startsWith("−");
  const isPositive = sign && !isNegative && Number(decimalValue) !== 0;

  return (
    <span
      className={cn(
        "tabular-nums",
        isNegative && "text-danger-fg",
        isPositive && "text-success-fg",
        className
      )}
    >
      {isPositive ? "+" : ""}
      {formatted}
    </span>
  );
}
