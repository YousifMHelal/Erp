"use client";

import { Plus, Wallet } from "lucide-react";
import { useTranslations } from "next-intl";
import type { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DataTable } from "@/components/shared/data-table/data-table";
import { EmptyState } from "@/components/shared/empty-state";
import { StatusBadge } from "@/components/shared/status-badge";
import type { SettingsCashboxRow } from "@/types";

export function SettingsCashboxesTable({ cashboxes }: { cashboxes: SettingsCashboxRow[] }) {
  const t = useTranslations("settings.cashboxes");

  const columns: ColumnDef<SettingsCashboxRow, unknown>[] = [
    { accessorKey: "name", header: t("columnName") },
    { accessorKey: "description", header: t("columnDescription"), cell: ({ getValue }) => getValue<string>() || "—" },
    {
      accessorKey: "isActive",
      header: t("columnStatus"),
      cell: ({ getValue }) =>
        getValue<boolean>() ? <StatusBadge tone="success" label={t("active")} /> : <StatusBadge tone="neutral" label={t("inactive")} />,
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={cashboxes}
      getRowId={(row) => row.id}
      renderMobileCard={(row) => (
        <Card>
          <div className="flex items-center justify-between gap-3 p-4">
            <div className="flex flex-col">
              <span className="font-medium">{row.name}</span>
              {row.description && <span className="text-body-sm text-muted-foreground">{row.description}</span>}
            </div>
            {row.isActive ? <StatusBadge tone="success" label={t("active")} /> : <StatusBadge tone="neutral" label={t("inactive")} />}
          </div>
        </Card>
      )}
      emptyState={<EmptyState icon={<Wallet className="size-6" />} title={t("empty")} />}
      toolbar={
        <div className="flex justify-end p-3">
          <Button type="button" variant="primary">
            <Plus /> {t("newCashbox")}
          </Button>
        </div>
      }
    />
  );
}
