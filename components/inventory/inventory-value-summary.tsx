import { useTranslations } from "next-intl";
import { PackageSearch, TriangleAlert, Wallet } from "lucide-react";
import { StatCard } from "@/components/shared/stat-card";
import { Money } from "@/components/shared/money";
import type { InventoryValueSummaryProps } from "@/types";

export function InventoryValueSummary({
  totalCostValue,
  totalSaleValue,
  productCount,
  lowStockCount,
  outOfStockCount,
}: InventoryValueSummaryProps) {
  const t = useTranslations("inventory");

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard label={t("productCount")} value={productCount} icon={PackageSearch} />
      <StatCard label={t("valueAtCost")} value={<Money value={totalCostValue} />} icon={Wallet} />
      <StatCard label={t("valueAtSale")} value={<Money value={totalSaleValue} />} icon={Wallet} />
      <StatCard label={t("lowAndOutCount")} value={`${lowStockCount + outOfStockCount}`} icon={TriangleAlert} />
    </div>
  );
}
