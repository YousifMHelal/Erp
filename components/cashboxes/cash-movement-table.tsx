import Link from "next/link";
import { useTranslations } from "next-intl";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState } from "@/components/shared/empty-state";
import { Money } from "@/components/shared/money";
import { History } from "lucide-react";
import { formatDate } from "@/lib/format";
import type { CashMovementRefType, CashMovementRow, CashMovementTableProps } from "@/types";

const REF_BASE_PATH: Record<CashMovementRefType, string> = {
  SALE: "/sales",
  PURCHASE: "/purchases",
  COLLECTION: "/collections",
  PAYMENT: "/payments",
};

function getRefHref(movement: CashMovementRow): string | undefined {
  if (!movement.refType || !movement.refId) return undefined;
  return `${REF_BASE_PATH[movement.refType]}/${movement.refId}`;
}

function RefLabel({ movement }: { movement: CashMovementRow }) {
  const href = getRefHref(movement);
  if (!href) return <span className="text-muted-foreground">{movement.refLabel}</span>;
  return (
    <Link href={href} className="text-primary hover:underline">
      {movement.refLabel}
    </Link>
  );
}

export function CashMovementTable({ movements }: CashMovementTableProps) {
  const t = useTranslations("cashboxes");
  const tType = useTranslations("cashboxes.movementType");

  if (movements.length === 0) {
    return <EmptyState icon={<History className="size-6" />} title={t("movementsEmpty")} />;
  }

  return (
    <Card className="overflow-hidden p-0">
      <div className="hidden max-h-[calc(100vh-16rem)] overflow-y-auto md:block">
        <Table>
          <TableHeader className="sticky top-0 z-10 bg-muted">
            <TableRow className="hover:bg-transparent">
              <TableHead className="text-label">{t("columnNumber")}</TableHead>
              <TableHead className="text-label">{t("columnDate")}</TableHead>
              <TableHead className="hidden text-label lg:table-cell">{t("columnCashbox")}</TableHead>
              <TableHead className="text-label">{t("columnType")}</TableHead>
              <TableHead className="hidden text-label lg:table-cell">{t("columnParty")}</TableHead>
              <TableHead className="text-label">{t("columnRef")}</TableHead>
              <TableHead className="text-label text-end">{t("columnAmount")}</TableHead>
              <TableHead className="text-label text-end">{t("columnBalanceAfter")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {movements.map((movement, i) => (
              <TableRow key={movement.id}>
                <TableCell className="tabular-nums text-muted-foreground">{i + 1}</TableCell>
                <TableCell className="tabular-nums">{formatDate(movement.createdAt)}</TableCell>
                <TableCell className="hidden lg:table-cell">{movement.cashboxName}</TableCell>
                <TableCell>{tType(movement.type)}</TableCell>
                <TableCell className="hidden text-muted-foreground lg:table-cell">{movement.partyName ?? "—"}</TableCell>
                <TableCell className="text-muted-foreground">
                  <RefLabel movement={movement} />
                </TableCell>
                <TableCell className="text-end">
                  <Money value={movement.amount} sign />
                </TableCell>
                <TableCell className="text-end font-medium tabular-nums">
                  <Money value={movement.balanceAfter} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-col divide-y divide-border md:hidden">
        {movements.map((movement) => (
          <div key={movement.id} className="flex flex-col gap-1.5 p-4">
            <div className="flex items-center justify-between">
              <span className="font-medium">{tType(movement.type)}</span>
              <Money value={movement.amount} sign className="font-medium" />
            </div>
            <div className="flex items-center justify-between text-body-sm text-muted-foreground">
              <span>{movement.cashboxName}</span>
              <span className="tabular-nums">{formatDate(movement.createdAt)}</span>
            </div>
            {movement.partyName && <span className="text-caption text-muted-foreground">{movement.partyName}</span>}
            <span className="text-caption">
              <RefLabel movement={movement} />
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
}
