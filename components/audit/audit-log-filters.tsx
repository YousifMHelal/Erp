"use client";

import { format } from "date-fns";
import { usePathname, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { DateRangePicker } from "@/components/shared/date-range-picker";
import { EntityCombobox } from "@/components/shared/entity-combobox";
import type { AuditLogFilters, AuditLogFiltersProps, DateRange } from "@/types";

export function AuditLogFiltersBar({ filters, users, actions, entityTypes }: AuditLogFiltersProps) {
  const t = useTranslations("auditLog");
  const router = useRouter();
  const pathname = usePathname();
  const dateRange = { from: filters.from ? new Date(`${filters.from}T00:00:00`) : undefined, to: filters.to ? new Date(`${filters.to}T00:00:00`) : undefined };
  const actionOptions = actions.map((option) => {
    const key = `actions.${option.value.replaceAll(".", "_")}`;
    return { ...option, label: t.has(key) ? t(key) : option.label };
  });
  const entityOptions = entityTypes.map((option) => ({ ...option, label: t.has(`entities.${option.value}`) ? t(`entities.${option.value}`) : option.label }));

  function update(changes: Partial<AuditLogFilters>) {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries({ ...filters, ...changes, page: undefined })) if (value) params.set(key, value);
    router.push(`${pathname}?${params.toString()}`);
  }

  function updateDate(range: DateRange) {
    update({ from: range.from ? format(range.from, "yyyy-MM-dd") : undefined, to: range.to ? format(range.to, "yyyy-MM-dd") : undefined });
  }

  return (
    <div className="mb-4 flex flex-wrap items-center gap-2">
      <DateRangePicker className="w-56 shrink-0" value={dateRange} onChange={updateDate} placeholder={t("filterDate")} />
      <EntityCombobox className="w-44 shrink-0" options={users} value={filters.userId} onChange={(value) => update({ userId: value })} placeholder={t("filterUser")} />
      <EntityCombobox className="w-44 shrink-0" options={actionOptions} value={filters.action} onChange={(value) => update({ action: value })} placeholder={t("filterAction")} />
      <EntityCombobox className="w-44 shrink-0" options={entityOptions} value={filters.entityType} onChange={(value) => update({ entityType: value })} placeholder={t("filterEntity")} />
    </div>
  );
}
