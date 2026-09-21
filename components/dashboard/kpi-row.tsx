import { Banknote, FileText, PackagePlus, Users } from "lucide-react";
import { useTranslations } from "next-intl";
import { StatCard } from "@/components/shared/stat-card";
import type { KpiRowProps } from "@/types";

export function KpiRow({
  todaySales,
  todaySalesDelta,
  todayPurchases,
  todayPurchasesDelta,
  invoiceCount,
  invoiceCountDelta,
  totalReceivables,
}: KpiRowProps) {
  const t = useTranslations("dashboard");

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard label={t("todaySales")} value={todaySales} delta={todaySalesDelta} icon={Banknote} />
      <StatCard
        label={t("todayPurchases")}
        value={todayPurchases}
        delta={todayPurchasesDelta}
        icon={PackagePlus}
      />
      <StatCard
        label={t("invoiceCount")}
        value={invoiceCount}
        delta={invoiceCountDelta}
        icon={FileText}
      />
      <StatCard label={t("totalReceivables")} value={totalReceivables} icon={Users} />
    </div>
  );
}
