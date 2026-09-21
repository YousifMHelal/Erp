import Link from "next/link";
import { User, Wallet } from "lucide-react";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Money } from "@/components/shared/money";
import type { InvoicePartyCardProps } from "@/types";

export function InvoicePartyCard({ invoice }: InvoicePartyCardProps) {
  const t = useTranslations("invoices.detail");
  const tParty = useTranslations("invoices.party");
  const isPurchaseSide = invoice.type === "PURCHASE" || invoice.type === "PURCHASE_RETURN";
  const partyHref = isPurchaseSide ? "/suppliers/1" : "/customers/1";
  const partyTitle = isPurchaseSide ? tParty("PURCHASE") : tParty("SALE");

  return (
    <Card>
      <CardHeader>
        <CardTitle>{partyTitle}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <Link href={partyHref} className="flex items-center gap-2 hover:underline">
          <User className="size-4 text-muted-foreground" aria-hidden="true" />
          <span className="font-medium">{invoice.partyName}</span>
        </Link>
        {invoice.partyPhone && (
          <span className="text-body-sm text-muted-foreground" dir="ltr">
            {invoice.partyPhone}
          </span>
        )}
        <div className="flex items-center gap-2 border-t border-border pt-3">
          <Wallet className="size-4 text-muted-foreground" aria-hidden="true" />
          <span className="text-body-sm text-muted-foreground">{invoice.cashboxName}</span>
        </div>
        {invoice.partyBalance && (
          <div className="flex items-center justify-between">
            <span className="text-body-sm text-muted-foreground">{t("partyBalanceLabel")}</span>
            <Money value={invoice.partyBalance} className="font-medium" />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
