"use client";

import { useTranslations } from "next-intl";
import { DateRangePicker } from "@/components/shared/date-range-picker";
import { EntityCombobox } from "@/components/shared/entity-combobox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { InvoiceFiltersProps } from "@/types";

export function InvoiceFilters({
  dateRange,
  onDateRangeChange,
  customerId,
  onCustomerChange,
  customerOptions,
  paymentStatus,
  onPaymentStatusChange,
}: InvoiceFiltersProps) {
  const t = useTranslations("sales.list");
  const tStatus = useTranslations("invoices.paymentStatus");

  return (
    <div className="flex flex-wrap items-center gap-2">
      <DateRangePicker value={dateRange} onChange={onDateRangeChange} className="sm:w-56" />
      <EntityCombobox
        options={customerOptions}
        value={customerId}
        onChange={onCustomerChange}
        placeholder={t("customerFilterPlaceholder")}
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
