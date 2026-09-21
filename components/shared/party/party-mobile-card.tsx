import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { BalanceBadge } from "@/components/shared/party/balance-badge";
import { PartyRowActions } from "@/components/shared/party/party-row-actions";
import type { PartyMobileCardProps } from "@/types";

export function PartyMobileCard({ party, partyType, onEdit, onDelete }: PartyMobileCardProps) {
  const detailBasePath = partyType === "CUSTOMER" ? "/customers" : "/suppliers";

  return (
    <Card>
      <CardContent className="flex items-center justify-between gap-3">
        <Link href={`${detailBasePath}/${party.id}`} className="flex flex-1 flex-col">
          <span className="font-medium">{party.name}</span>
          {party.phone && (
            <span className="text-body-sm text-muted-foreground tabular-nums" dir="ltr">
              {party.phone}
            </span>
          )}
        </Link>
        <div className="flex items-center gap-2">
          <BalanceBadge partyType={partyType} balance={party.balance} />
          <PartyRowActions partyType={partyType} party={party} onEdit={onEdit} onDelete={onDelete} />
        </div>
      </CardContent>
    </Card>
  );
}
