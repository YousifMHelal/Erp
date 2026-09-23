import { useTranslations } from "next-intl";
import { DateRangePicker } from "@/components/shared/date-range-picker";
import { EntityCombobox } from "@/components/shared/entity-combobox";
import type { ReportFiltersBarProps } from "@/types";

export function ReportFiltersBar(props: ReportFiltersBarProps) {
  const t = useTranslations("reports");
  const { reportKey, filters, options, onFilterChange } = props;
  const showCustomer = ["sales", "customers", "cashboxes", "collections", "profit-loss"].includes(reportKey);
  const showSupplier = ["purchases", "suppliers", "cashboxes", "payments"].includes(reportKey);
  const showCashbox = ["sales", "purchases", "cashboxes", "collections", "payments", "profit-loss"].includes(reportKey);
  const showProduct = ["sales", "purchases", "inventory", "profit-loss"].includes(reportKey);
  const showUser = ["sales", "purchases", "profit-loss"].includes(reportKey);

  const comboClass = "w-44 shrink-0";

  return (
    <div className="flex flex-wrap items-center gap-2">
      <DateRangePicker className="w-56 shrink-0" value={props.dateRange} onChange={props.onDateRangeChange} placeholder={t("dateRangePlaceholder")} />
      {showCustomer ? <EntityCombobox className={comboClass} options={options.customers} value={filters.customerId} onChange={(value) => onFilterChange("customerId", value)} placeholder={t("allCustomers")} /> : null}
      {showSupplier ? <EntityCombobox className={comboClass} options={options.suppliers} value={filters.supplierId} onChange={(value) => onFilterChange("supplierId", value)} placeholder={t("allSuppliers")} /> : null}
      {showCashbox ? <EntityCombobox className={comboClass} options={options.cashboxes} value={filters.cashboxId} onChange={(value) => onFilterChange("cashboxId", value)} placeholder={t("allCashboxes")} /> : null}
      {reportKey === "inventory" ? <EntityCombobox className={comboClass} options={options.categories} value={filters.categoryId} onChange={(value) => onFilterChange("categoryId", value)} placeholder={t("allCategories")} /> : null}
      {showProduct ? <EntityCombobox className={comboClass} options={options.products} value={filters.productId} onChange={(value) => onFilterChange("productId", value)} placeholder={t("allProducts")} /> : null}
      {showUser ? <EntityCombobox className={comboClass} options={options.users} value={filters.userId} onChange={(value) => onFilterChange("userId", value)} placeholder={t("allUsers")} /> : null}
    </div>
  );
}
