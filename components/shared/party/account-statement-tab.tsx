"use client";

import { useMemo } from "react";
import Link from "next/link";
import { ArrowDownWideNarrow, ArrowUpNarrowWide, Copy, FileClock, Printer } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DateRangePicker } from "@/components/shared/date-range-picker";
import { EmptyState } from "@/components/shared/empty-state";
import { Money } from "@/components/shared/money";
import { formatDate, toDateInputValue } from "@/lib/format";
import { applyStatementFilters } from "@/lib/statement-filters";
import { cn } from "@/lib/utils";
import type { AccountStatementTabProps, DateRange, StatementLine, StatementTypeFilter } from "@/types";

type PartyType = AccountStatementTabProps["partyType"];

function invoiceHref(partyType: PartyType, line: StatementLine) {
  if (!line.invoiceId) return undefined;
  if (partyType === "CUSTOMER") return line.isReturn ? `/sales-returns/${line.invoiceId}` : `/sales/${line.invoiceId}`;
  return line.isReturn ? `/purchase-returns/${line.invoiceId}` : `/purchases/${line.invoiceId}`;
}

/** `yyyy-MM-dd` → that calendar day at local midnight, for the date-range picker. */
function dayToDate(day: string | undefined): Date | undefined {
  return day ? new Date(`${day}T00:00:00`) : undefined;
}

function Description({ partyType, line }: { partyType: PartyType; line: StatementLine }) {
  const href = invoiceHref(partyType, line);
  if (!href) return <span className={cn(line.isCarriedForward && "font-medium")}>{line.description}</span>;
  return (
    <Link href={href} className="font-medium text-primary hover:underline">
      {line.description}
    </Link>
  );
}

function PositiveMoney({ value, className }: { value: string; className: string }) {
  return Number(value) > 0 ? <Money value={value} className={className} /> : <>—</>;
}

export function AccountStatementTab({
  partyType,
  statement,
  filters,
  onFiltersChange,
  onPrint,
  onCopyImage,
  isCopyingImage,
}: AccountStatementTabProps) {
  const t = useTranslations("parties.detail");
  const rows = useMemo(() => applyStatementFilters(statement, filters), [statement, filters]);
  const dateRange: DateRange = { from: dayToDate(filters.from), to: dayToDate(filters.to) };
  const typeOptions: { value: StatementTypeFilter; label: string }[] = [
    { value: "ALL", label: t("statementTypeAll") },
    { value: "INVOICE", label: t("statementTypeInvoice") },
    { value: "PAYMENT", label: partyType === "CUSTOMER" ? t("statementTypeCollection") : t("statementTypePayment") },
    { value: "RETURN", label: t("statementTypeReturn") },
    { value: "OPENING", label: t("statementTypeOpening") },
  ];
  const isNewestFirst = filters.sort === "desc";

  function handleDateRangeChange(range: DateRange) {
    onFiltersChange({ ...filters, from: toDateInputValue(range.from), to: toDateInputValue(range.to) });
  }

  if (statement.length === 0) {
    return <EmptyState icon={<FileClock className="size-6" />} title={t("statementEmpty")} />;
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <DateRangePicker
          value={dateRange}
          onChange={handleDateRangeChange}
          placeholder={t("statementFilterDate")}
          className="sm:w-56"
        />
        <Select
          value={filters.type}
          onValueChange={(value) => onFiltersChange({ ...filters, type: value as StatementTypeFilter })}
        >
          <SelectTrigger className="w-full sm:w-44" aria-label={t("statementTypeFilterLabel")}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {typeOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          type="button"
          variant="outline"
          aria-label={t("statementSortLabel")}
          onClick={() => onFiltersChange({ ...filters, sort: isNewestFirst ? "asc" : "desc" })}
        >
          {isNewestFirst ? <ArrowDownWideNarrow /> : <ArrowUpNarrowWide />}
          {isNewestFirst ? t("statementSortDesc") : t("statementSortAsc")}
        </Button>
        <div className="flex gap-2 sm:ms-auto">
          <Button type="button" variant="outline" size="sm" onClick={onCopyImage} disabled={isCopyingImage}>
            <Copy /> {isCopyingImage ? t("statementImagePreparing") : t("copyStatementImage")}
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={onPrint}>
            <Printer /> {t("printStatement")}
          </Button>
        </div>
      </div>
      {rows.length === 0 ? (
        <EmptyState icon={<FileClock className="size-6" />} title={t("statementFilteredEmpty")} />
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
                {rows.map((line) => (
                  <TableRow key={line.id} className={cn(line.isCarriedForward && "bg-muted/50")}>
                    <TableCell className="tabular-nums">{formatDate(line.date)}</TableCell>
                    <TableCell>
                      <Description partyType={partyType} line={line} />
                    </TableCell>
                    <TableCell className="tabular-nums">
                      <PositiveMoney value={line.debit} className="text-danger-fg" />
                    </TableCell>
                    <TableCell className="tabular-nums">
                      <PositiveMoney value={line.credit} className="text-success-fg" />
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
            {rows.map((line) => (
              <div key={line.id} className={cn("flex flex-col gap-1.5 p-4", line.isCarriedForward && "bg-muted/50")}>
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
