import { useTranslations } from "next-intl";
import { ClipboardCheck, TrendingDown, TrendingUp } from "lucide-react";
import { StatCard } from "@/components/shared/stat-card";
import type { StocktakeDiffSummaryProps } from "@/types";

export function StocktakeDiffSummary({ lines }: StocktakeDiffSummaryProps) {
  const t = useTranslations("inventory.stocktake");
  const counted = lines.filter((l) => l.countedQty !== null);
  const surplus = counted.filter((l) => (l.countedQty as number) - l.systemQty > 0).length;
  const shortage = counted.filter((l) => (l.countedQty as number) - l.systemQty < 0).length;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <StatCard label={t("countedLines", { count: lines.length })} value={`${counted.length} / ${lines.length}`} icon={ClipboardCheck} />
      <StatCard label={t("surplusLines")} value={surplus} icon={TrendingUp} />
      <StatCard label={t("shortageLines")} value={shortage} icon={TrendingDown} />
    </div>
  );
}
