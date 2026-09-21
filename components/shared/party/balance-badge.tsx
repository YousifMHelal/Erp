import { useTranslations } from "next-intl";
import { StatusBadge } from "@/components/shared/status-badge";
import { formatMoney } from "@/lib/format";
import type { BalanceBadgeProps } from "@/types";

export function BalanceBadge({ partyType, balance }: BalanceBadgeProps) {
  const t = useTranslations("parties");
  const amount = Number(balance);

  if (amount === 0) {
    return <StatusBadge tone="neutral" label={formatMoney(balance)} />;
  }

  // Customer balance > 0 means they owe the shop (danger); supplier balance > 0 means the shop owes them (warning).
  const tone = partyType === "CUSTOMER" ? "danger" : "warning";
  const label = partyType === "CUSTOMER" ? t("owesShop", { amount: formatMoney(balance) }) : t("shopOwes", { amount: formatMoney(balance) });

  return <StatusBadge tone={tone} label={label} />;
}
