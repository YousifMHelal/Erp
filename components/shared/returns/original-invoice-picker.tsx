import { useTranslations } from "next-intl";
import { EntityCombobox } from "@/components/shared/entity-combobox";
import { Label } from "@/components/ui/label";
import { formatDate } from "@/lib/format";
import type { OriginalInvoicePickerProps } from "@/types";

export function OriginalInvoicePicker({ options, selectedId, onSelect }: OriginalInvoicePickerProps) {
  const t = useTranslations("returns.form");

  const comboOptions = options.map((invoice) => ({
    value: invoice.id,
    label: `#${String(invoice.number).padStart(6, "0")} — ${invoice.partyName}`,
    description: `${formatDate(invoice.issuedAt)} · ${invoice.total} ج.م`,
  }));

  return (
    <div className="flex flex-col gap-1.5">
      <Label>{t("originalInvoiceLabel")}</Label>
      <EntityCombobox
        options={comboOptions}
        value={selectedId}
        onChange={onSelect}
        placeholder={t("originalInvoicePlaceholder")}
        searchPlaceholder={t("originalInvoiceSearchPlaceholder")}
        emptyMessage={t("originalInvoiceEmpty")}
      />
    </div>
  );
}
