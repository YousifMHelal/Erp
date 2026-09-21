import { useTranslations } from "next-intl";
import { Card, CardContent } from "@/components/ui/card";
import { Money } from "@/components/shared/money";
import type { PartyBalancePreviewProps } from "@/types";

export function PartyBalancePreview({ documentType, partyName, currentBalance, amount }: PartyBalancePreviewProps) {
  const t = useTranslations("moneyDocuments.form");
  // Collection reduces a customer's debt; payment reduces the shop's debt to a supplier. Both subtract from the displayed balance.
  const balanceAfter = Number(currentBalance) - amount;

  return (
    <Card>
      <CardContent className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="text-body-sm text-muted-foreground">{t("partyLabel")}</span>
          <span className="font-medium">{partyName || "—"}</span>
        </div>
        <div className="flex items-center justify-between border-t border-border pt-3">
          <span className="text-body-sm text-muted-foreground">{t("currentBalance")}</span>
          <Money value={currentBalance} />
        </div>
        <div className="flex items-center justify-between">
          <span className="text-body-sm text-muted-foreground">
            {documentType === "COLLECTION" ? t("amountCollected") : t("amountPaid")}
          </span>
          <Money value={String(amount)} />
        </div>
        <div className="flex items-center justify-between border-t border-border pt-3">
          <span className="font-medium">{t("balanceAfter")}</span>
          <Money value={String(balanceAfter)} className="text-h3 font-semibold" />
        </div>
      </CardContent>
    </Card>
  );
}
