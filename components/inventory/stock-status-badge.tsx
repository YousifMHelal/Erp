import { useTranslations } from "next-intl";
import { StatusBadge } from "@/components/shared/status-badge";
import type { StockStatusBadgeProps } from "@/types";

const TONE = { IN_STOCK: "success", LOW_STOCK: "warning", OUT_OF_STOCK: "danger" } as const;

export function StockStatusBadge({ status }: StockStatusBadgeProps) {
  const t = useTranslations("inventory.stockStatus");
  return <StatusBadge tone={TONE[status]} label={t(status)} />;
}

export function stockStatusFor(stockQty: number, minStockQty: number): "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK" {
  if (stockQty <= 0) return "OUT_OF_STOCK";
  if (stockQty <= minStockQty) return "LOW_STOCK";
  return "IN_STOCK";
}
