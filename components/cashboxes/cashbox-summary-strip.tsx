import { Wallet } from "lucide-react";
import { useTranslations } from "next-intl";
import { Card, CardContent } from "@/components/ui/card";
import { Money } from "@/components/shared/money";
import { cn } from "@/lib/utils";
import { decimal } from "@/lib/money";
import type { CashboxSummaryStripProps } from "@/types";

export function CashboxSummaryStrip({ cashboxes, selectedId, onSelectCashbox }: CashboxSummaryStripProps) {
  const t = useTranslations("cashboxes");
  const total = cashboxes.reduce((sum, c) => sum.plus(c.balance), decimal(0));

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <button type="button" onClick={() => onSelectCashbox(undefined)} className="text-start">
        <Card
          className={cn(
            "cursor-pointer transition-colors duration-200 hover:bg-muted",
            selectedId === undefined && "border-primary ring-1 ring-primary",
          )}
        >
          <CardContent className="flex flex-col gap-2">
            <span className="flex items-center gap-2 text-label text-muted-foreground">
              <Wallet className="size-4" aria-hidden="true" />
              {t("allCashboxes")}
            </span>
            <Money value={total.toString()} className="text-h2" />
          </CardContent>
        </Card>
      </button>
      {cashboxes.map((cashbox) => (
        <button key={cashbox.id} type="button" onClick={() => onSelectCashbox(cashbox.id)} className="text-start">
          <Card
            className={cn(
              "cursor-pointer transition-colors duration-200 hover:bg-muted",
              selectedId === cashbox.id && "border-primary ring-1 ring-primary",
            )}
          >
            <CardContent className="flex flex-col gap-2">
              <span className="flex items-center gap-2 text-label text-muted-foreground">
                <Wallet className="size-4" aria-hidden="true" />
                {cashbox.name}
              </span>
              <Money value={cashbox.balance} className="text-h2" />
            </CardContent>
          </Card>
        </button>
      ))}
    </div>
  );
}
