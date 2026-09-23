import Link from "next/link";
import { FileClock, Printer } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState } from "@/components/shared/empty-state";
import { Money } from "@/components/shared/money";
import { formatDate } from "@/lib/format";
import type { AccountStatementTabProps, StatementLine } from "@/types";

function invoiceHref(partyType: AccountStatementTabProps["partyType"], line: StatementLine) {
  if (!line.invoiceId) return undefined;
  if (partyType === "CUSTOMER") return line.isReturn ? `/sales-returns/${line.invoiceId}` : `/sales/${line.invoiceId}`;
  return line.isReturn ? `/purchase-returns/${line.invoiceId}` : `/purchases/${line.invoiceId}`;
}

function Description({ partyType, line }: { partyType: AccountStatementTabProps["partyType"]; line: StatementLine }) {
  const href = invoiceHref(partyType, line);
  if (!href) return <span>{line.description}</span>;
  return (
    <Link href={href} className="font-medium text-primary hover:underline">
      {line.description}
    </Link>
  );
}

export function AccountStatementTab({ partyType, statement, onPrint }: AccountStatementTabProps) {
  const t = useTranslations("parties.detail");

  return (
    <div className="flex flex-col gap-3">
      <div className="flex justify-end">
        <Button type="button" variant="outline" size="sm" onClick={onPrint}>
          <Printer /> {t("printStatement")}
        </Button>
      </div>
      {statement.length === 0 ? (
        <EmptyState icon={<FileClock className="size-6" />} title={t("statementEmpty")} />
      ) : (
        <>
          <div className="hidden md:block">
            <Table>
              <TableHeader className="bg-muted">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-label">{t("columnDate")}</TableHead>
                  <TableHead className="text-label">{t("columnDescription")}</TableHead>
                  <TableHead className="text-label">{t("columnDebit")}</TableHead>
                  <TableHead className="text-label">{t("columnCredit")}</TableHead>
                  <TableHead className="text-label text-end">{t("columnBalanceAfter")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {statement.map((line) => (
                  <TableRow key={line.id}>
                    <TableCell className="tabular-nums">{formatDate(line.date)}</TableCell>
                    <TableCell>
                      <Description partyType={partyType} line={line} />
                    </TableCell>
                    <TableCell className="tabular-nums">
                      {Number(line.debit) > 0 ? <Money value={line.debit} className="text-danger-fg" /> : "—"}
                    </TableCell>
                    <TableCell className="tabular-nums">
                      {Number(line.credit) > 0 ? <Money value={line.credit} className="text-success-fg" /> : "—"}
                    </TableCell>
                    <TableCell className="text-end font-medium">
                      <Money value={line.balanceAfter} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="flex flex-col divide-y divide-border rounded-md border border-border md:hidden">
            {statement.map((line) => (
              <div key={line.id} className="flex flex-col gap-1.5 p-4">
                <div className="flex items-center justify-between">
                  <Description partyType={partyType} line={line} />
                  <span className="tabular-nums text-caption text-muted-foreground">{formatDate(line.date)}</span>
                </div>
                <div className="flex items-center justify-between text-body-sm">
                  <span className="text-muted-foreground">
                    {Number(line.debit) > 0 && (
                      <>
                        {t("columnDebit")}: <Money value={line.debit} className="text-danger-fg" />
                      </>
                    )}
                    {Number(line.credit) > 0 && (
                      <>
                        {t("columnCredit")}: <Money value={line.credit} className="text-success-fg" />
                      </>
                    )}
                  </span>
                  <span className="font-medium">
                    <Money value={line.balanceAfter} />
                  </span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
