"use client";

import { useState } from "react";
import { Eye, History } from "lucide-react";
import { useTranslations } from "next-intl";
import type { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DataTable } from "@/components/shared/data-table/data-table";
import { EmptyState } from "@/components/shared/empty-state";
import { AppTooltip } from "@/components/shared/app-tooltip";
import { AuditDiffDialog } from "@/components/audit/audit-diff-dialog";
import { formatDate } from "@/lib/format";
import type { AuditLogListProps, AuditLogRow } from "@/types";

export function AuditLogList({ entries }: AuditLogListProps) {
  const t = useTranslations("auditLog");
  const [selected, setSelected] = useState<AuditLogRow | undefined>(undefined);
  const [dialogOpen, setDialogOpen] = useState(false);

  const columns: ColumnDef<AuditLogRow, unknown>[] = [
    { accessorKey: "createdAt", header: t("columnDate"), cell: ({ getValue }) => <span className="tabular-nums">{formatDate(getValue<string>())}</span> },
    { accessorKey: "userName", header: t("columnUser") },
    { accessorKey: "action", header: t("columnAction") },
    { accessorKey: "entityLabel", header: t("columnEntity") },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <AppTooltip content={t("viewDiff")}>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={() => {
              setSelected(row.original);
              setDialogOpen(true);
            }}
            aria-label={t("viewDiff")}
          >
            <Eye className="size-4" />
          </Button>
        </AppTooltip>
      ),
    },
  ];

  return (
    <>
      <DataTable
        columns={columns}
        data={entries}
        getRowId={(row) => row.id}
        renderMobileCard={(row) => (
          <Card>
            <div className="flex flex-col gap-2 p-4">
              <div className="flex items-center justify-between">
                <span className="font-medium">{row.action}</span>
                <span className="tabular-nums text-caption text-muted-foreground">{formatDate(row.createdAt)}</span>
              </div>
              <span className="text-body-sm text-muted-foreground">
                {row.userName} · {row.entityLabel}
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelected(row);
                  setDialogOpen(true);
                }}
              >
                <Eye /> {t("viewDiff")}
              </Button>
            </div>
          </Card>
        )}
        emptyState={<EmptyState icon={<History className="size-6" />} title={t("empty")} />}
      />
      <AuditDiffDialog open={dialogOpen} onOpenChange={setDialogOpen} entry={selected} />
    </>
  );
}
