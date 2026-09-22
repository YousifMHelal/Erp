import { useTranslations } from "next-intl";
import { Card, CardContent } from "@/components/ui/card";
import { Money } from "@/components/shared/money";
import { decimal } from "@/lib/money";
import type { PartyBalancePreviewProps } from "@/types";

export function PartyBalancePreview({ documentType, partyName, currentBalance, amount }: PartyBalancePreviewProps) {
  const t = useTranslations("moneyDocuments.form");
  // Collection reduces a customer's debt; payment reduces the shop's debt to a supplier. Both subtract from the displayed balance.
  // Mirrors the `moneyText` shape in lib/validations.ts so the live preview never accepts input the server would reject.
  const previewAmount = /^(?:0|[1-9]\d{0,11})(?:\.\d{1,2})?$/.test(amount) ? amount : "0";
  const balanceAfter = decimal(currentBalance).minus(decimal(previewAmount || "0"));

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
          <Money value={previewAmount || "0"} />
        </div>
        <div className="flex items-center justify-between border-t border-border pt-3">
          <span className="font-medium">{t("balanceAfter")}</span>
          <Money value={balanceAfter.toString()} className="text-h3 font-semibold" />
        </div>
      </CardContent>
    </Card>
  );
}
