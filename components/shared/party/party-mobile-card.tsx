import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { BalanceBadge } from "@/components/shared/party/balance-badge";
import type { PartyListRow, PartyType } from "@/types";

export function PartyMobileCard({ party, partyType }: { party: PartyListRow; partyType: PartyType }) {
  const detailBasePath = partyType === "CUSTOMER" ? "/customers" : "/suppliers";

  return (
    <Link href={`${detailBasePath}/${party.id}`}>
      <Card>
        <CardContent className="flex items-center justify-between gap-3">
          <div className="flex flex-col">
            <span className="font-medium">{party.name}</span>
            {party.phone && (
              <span className="text-body-sm text-muted-foreground tabular-nums" dir="ltr">
                {party.phone}
              </span>
            )}
          </div>
          <BalanceBadge partyType={partyType} balance={party.balance} />
        </CardContent>
      </Card>
    </Link>
  );
}
