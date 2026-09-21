import { MessageCircle, Pencil, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Money } from "@/components/shared/money";
import { AppTooltip } from "@/components/shared/app-tooltip";
import { BalanceBadge } from "@/components/shared/party/balance-badge";
import type { PartySummaryCardProps } from "@/types";

export function PartySummaryCard({ party, partyType, onEdit, onDelete }: PartySummaryCardProps) {
  const t = useTranslations("parties.detail");
  const tCommon = useTranslations("common");
  const whatsappText = encodeURIComponent(t("whatsappGreeting", { name: party.name }));

  return (
    <Card>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex flex-col">
            <span className="text-h2">{party.name}</span>
            {party.phone && (
              <span className="text-body-sm text-muted-foreground tabular-nums" dir="ltr">
                {party.phone}
              </span>
            )}
            {party.address && <span className="text-body-sm text-muted-foreground">{party.address}</span>}
          </div>
          <div className="flex items-center gap-2">
            <BalanceBadge partyType={partyType} balance={party.balance} />
            <AppTooltip content={tCommon("edit")}>
              <Button type="button" variant="outline" size="icon" className="max-md:min-h-11 max-md:min-w-11" onClick={onEdit}>
                <Pencil />
              </Button>
            </AppTooltip>
            <AppTooltip content={tCommon("delete")}>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="max-md:min-h-11 max-md:min-w-11 text-destructive hover:text-destructive"
                onClick={onDelete}
              >
                <Trash2 />
              </Button>
            </AppTooltip>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 border-t border-border pt-4 sm:grid-cols-3">
          <Field label={t("openingBalance")} value={<Money value={party.openingBalance} />} />
          <Field label={t("totalInvoiced")} value={<Money value={party.totalInvoiced} />} />
          <Field label={t("currentBalance")} value={<Money value={party.balance} />} />
        </div>

        {party.phone && (
          <div className="flex justify-end border-t border-border pt-3">
            <Button asChild variant="outline" size="sm">
              <a href={`https://wa.me/2${party.phone}?text=${whatsappText}`} target="_blank" rel="noopener noreferrer">
                <MessageCircle /> {t("sendWhatsapp")}
              </a>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-caption text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
