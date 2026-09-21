"use client";

import { FolderTree, Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import type { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DataTable } from "@/components/shared/data-table/data-table";
import { EmptyState } from "@/components/shared/empty-state";
import { formatNumber } from "@/lib/format";
import type { CategoryRow } from "@/types";

export function CategoriesTable({ categories }: { categories: CategoryRow[] }) {
  const t = useTranslations("settings.categories");

  const columns: ColumnDef<CategoryRow, unknown>[] = [
    { accessorKey: "name", header: t("columnName") },
    { accessorKey: "description", header: t("columnDescription"), cell: ({ getValue }) => getValue<string>() || "—" },
    {
      accessorKey: "productCount",
      header: t("columnProductCount"),
      cell: ({ getValue }) => <span className="tabular-nums">{formatNumber(getValue<number>())}</span>,
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={categories}
      getRowId={(row) => row.id}
      renderMobileCard={(row) => (
        <Card>
          <div className="flex items-center justify-between gap-3 p-4">
            <div className="flex flex-col">
              <span className="font-medium">{row.name}</span>
              {row.description && <span className="text-body-sm text-muted-foreground">{row.description}</span>}
            </div>
            <span className="tabular-nums text-body-sm text-muted-foreground">{formatNumber(row.productCount)}</span>
          </div>
        </Card>
      )}
      emptyState={<EmptyState icon={<FolderTree className="size-6" />} title={t("empty")} />}
      toolbar={
        <div className="flex justify-end p-3">
          <Button type="button" variant="primary">
            <Plus /> {t("newCategory")}
          </Button>
        </div>
      }
    />
  );
}
