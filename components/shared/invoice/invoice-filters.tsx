"use client";

import { useTranslations } from "next-intl";
import { DateRangePicker } from "@/components/shared/date-range-picker";
import { EntityCombobox } from "@/components/shared/entity-combobox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { InvoiceFiltersProps } from "@/types";

export function InvoiceFilters({
  documentType,
  dateRange,
  onDateRangeChange,
  partyId,
  onPartyChange,
  partyOptions,
  paymentStatus,
  onPaymentStatusChange,
}: InvoiceFiltersProps) {
  const t = useTranslations("invoices.list");
  const tStatus = useTranslations("invoices.paymentStatus");
  const partyFilterPlaceholder =
    documentType === "SALE" ? t("customerFilterPlaceholderSale") : t("customerFilterPlaceholderPurchase");

  return (
    <div className="flex flex-wrap items-center gap-2">
      <DateRangePicker value={dateRange} onChange={onDateRangeChange} className="sm:w-56" />
      <EntityCombobox
        options={partyOptions}
        value={partyId}
        onChange={onPartyChange}
        placeholder={partyFilterPlaceholder}
        className="w-full sm:w-48"
      />
      <Select
        value={paymentStatus ?? "ALL"}
        onValueChange={(v) => onPaymentStatusChange(v === "ALL" ? undefined : v)}
      >
        <SelectTrigger className="w-full sm:w-40" aria-label={t("paymentStatusFilterLabel")}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">{t("allStatuses")}</SelectItem>
          <SelectItem value="PAID">{tStatus("PAID")}</SelectItem>
          <SelectItem value="PARTIAL">{tStatus("PARTIAL")}</SelectItem>
          <SelectItem value="UNPAID">{tStatus("UNPAID")}</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
