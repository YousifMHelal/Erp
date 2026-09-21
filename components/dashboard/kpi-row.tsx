import { Banknote, FileText, PackageX, Users } from "lucide-react";
import { useTranslations } from "next-intl";
import { StatCard } from "@/components/shared/stat-card";
import type { KpiRowProps } from "@/types";

export function KpiRow({
  todaySales,
  todaySalesDelta,
  invoiceCount,
  invoiceCountDelta,
  lowStockCount,
  totalReceivables,
}: KpiRowProps) {
  const t = useTranslations("dashboard");

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard label={t("todaySales")} value={todaySales} delta={todaySalesDelta} icon={Banknote} />
      <StatCard
        label={t("invoiceCount")}
        value={invoiceCount}
        delta={invoiceCountDelta}
        icon={FileText}
      />
      <StatCard label={t("lowStockCount")} value={lowStockCount} icon={PackageX} />
      <StatCard label={t("totalReceivables")} value={totalReceivables} icon={Users} />
    </div>
  );
}
