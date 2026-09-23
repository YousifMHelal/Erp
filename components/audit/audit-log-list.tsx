"use client";

import { useState } from "react";
import { Eye, History } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
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

export function AuditLogList({ entries, page, pageCount, totalCount }: AuditLogListProps) {
  const t = useTranslations("auditLog");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [selected, setSelected] = useState<AuditLogRow | undefined>(undefined);
  const [dialogOpen, setDialogOpen] = useState(false);

  function changePage(nextPage: number) {
    const params = new URLSearchParams(searchParams);
    params.set("page", String(nextPage));
    router.push(`${pathname}?${params.toString()}`);
  }

  function actionLabel(action: string): string {
    const key = `actions.${action.replaceAll(".", "_")}`;
    return t.has(key) ? t(key) : action;
  }

  const columns: ColumnDef<AuditLogRow, unknown>[] = [
    { accessorKey: "createdAt", header: t("columnDate"), cell: ({ getValue }) => <span className="tabular-nums">{formatDate(getValue<string>())}</span> },
    { accessorKey: "userName", header: t("columnUser") },
    { accessorKey: "action", header: t("columnAction"), cell: ({ getValue }) => actionLabel(getValue<string>()) },
    { accessorKey: "entityLabel", header: t("columnEntity") },
    {
      id: "actions",
      header: t("columnActions"),
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
                <span className="font-medium">{actionLabel(row.action)}</span>
                <span className="tabular-nums text-caption text-muted-foreground">{formatDate(row.createdAt)}</span>
              </div>
              <span className="text-body-sm text-muted-foreground">
                {row.userName} · {row.entityLabel}
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="max-md:min-h-11"
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
        page={page}
        pageCount={pageCount}
        totalCount={totalCount}
        onPageChange={changePage}
      />
      <AuditDiffDialog open={dialogOpen} onOpenChange={setDialogOpen} entry={selected} />
    </>
  );
}
