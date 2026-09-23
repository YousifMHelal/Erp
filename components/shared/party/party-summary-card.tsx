import { Pencil, Phone, MapPin } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AppTooltip } from "@/components/shared/app-tooltip";
import { BalanceBadge } from "@/components/shared/party/balance-badge";
import type { PartySummaryCardProps } from "@/types";

export function PartySummaryCard({ party, partyType, onEdit }: PartySummaryCardProps) {
  const tCommon = useTranslations("common");

  return (
    <Card>
      <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <span className="text-h2 font-semibold">{party.name}</span>
            <AppTooltip content={tCommon("edit")}>
              <Button type="button" variant="ghost" size="icon-sm" onClick={onEdit} aria-label={tCommon("edit")}>
                <Pencil className="size-4" />
              </Button>
            </AppTooltip>
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-body-sm text-muted-foreground">
            {party.phone && (
              <span className="flex items-center gap-1.5">
                <Phone className="size-3.5 shrink-0" aria-hidden="true" />
                <span className="tabular-nums" dir="ltr">{party.phone}</span>
              </span>
            )}
            {party.address && (
              <span className="flex items-center gap-1.5">
                <MapPin className="size-3.5 shrink-0" aria-hidden="true" />
                {party.address}
              </span>
            )}
          </div>
        </div>

        <BalanceBadge partyType={partyType} balance={party.balance} size="lg" />
      </CardContent>
    </Card>
  );
}
