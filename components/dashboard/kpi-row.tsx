import { Banknote, FileText, PackagePlus, Users } from "lucide-react";
import { useTranslations } from "next-intl";
import { CountUpMoney } from "@/components/shared/count-up-money";
import { CountUpNumber } from "@/components/shared/count-up-number";
import { StatCard } from "@/components/shared/stat-card";
import type { KpiRowProps } from "@/types";

function formatDelta(delta: { value: number; tone: "success" | "danger" }): {
  value: string;
  tone: "success" | "danger";
} {
  const sign = delta.value > 0 ? "+" : "";
  return { value: `${sign}${delta.value}%`, tone: delta.tone };
}

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
      <StatCard
        label={t("todaySales")}
        value={<CountUpMoney value={todaySales} />}
        delta={formatDelta(todaySalesDelta)}
        icon={Banknote}
      />
      <StatCard
        label={t("todayPurchases")}
        value={<CountUpMoney value={todayPurchases} />}
        delta={formatDelta(todayPurchasesDelta)}
        icon={PackagePlus}
      />
      <StatCard
        label={t("invoiceCount")}
        value={<CountUpNumber value={invoiceCount} />}
        delta={{ value: `${invoiceCountDelta.value > 0 ? "+" : ""}${invoiceCountDelta.value}`, tone: invoiceCountDelta.tone }}
        icon={FileText}
      />
      <StatCard label={t("totalReceivables")} value={<CountUpMoney value={totalReceivables} />} icon={Users} />
    </div>
  );
}
