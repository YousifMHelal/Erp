"use client";

import { useState } from "react";
import { Pencil, Plus, Trash2, Wallet } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import type { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DataTable } from "@/components/shared/data-table/data-table";
import { EmptyState } from "@/components/shared/empty-state";
import { StatusBadge } from "@/components/shared/status-badge";
import { AppTooltip } from "@/components/shared/app-tooltip";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { SettingsCashboxFormDialog } from "@/components/settings/settings-cashbox-form-dialog";
import type { SettingsCashboxRow } from "@/types";

export function SettingsCashboxesTable({ cashboxes: initialCashboxes }: { cashboxes: SettingsCashboxRow[] }) {
  const t = useTranslations("settings.cashboxes");
  const tCommon = useTranslations("common");

  const [cashboxes, setCashboxes] = useState(initialCashboxes);
  const [formOpen, setFormOpen] = useState(false);
  const [editingCashbox, setEditingCashbox] = useState<SettingsCashboxRow | undefined>(undefined);
  const [deletingCashbox, setDeletingCashbox] = useState<SettingsCashboxRow | undefined>(undefined);

  function handleSave(cashbox: SettingsCashboxRow) {
    setCashboxes((prev) =>
      prev.some((c) => c.id === cashbox.id) ? prev.map((c) => (c.id === cashbox.id ? cashbox : c)) : [...prev, cashbox],
    );
  }

  function handleDelete() {
    if (!deletingCashbox) return;
    setCashboxes((prev) => prev.filter((c) => c.id !== deletingCashbox.id));
    toast.success(t("deleteSuccess"));
    setDeletingCashbox(undefined);
    // P7-9 wires this to cashboxes.actions.ts delete.
  }

  const columns: ColumnDef<SettingsCashboxRow, unknown>[] = [
    { accessorKey: "name", header: t("columnName") },
    { accessorKey: "description", header: t("columnDescription"), cell: ({ getValue }) => getValue<string>() || "—" },
    {
      accessorKey: "isActive",
      header: t("columnStatus"),
      cell: ({ getValue }) =>
        getValue<boolean>() ? <StatusBadge tone="success" label={t("active")} /> : <StatusBadge tone="neutral" label={t("inactive")} />,
    },
    {
      id: "actions",
      header: t("columnActions"),
      cell: ({ row }) => (
        <div className="flex items-center justify-end gap-1">
          <AppTooltip content={t("editCashbox")}>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label={t("editCashbox")}
              onClick={() => {
                setEditingCashbox(row.original);
                setFormOpen(true);
              }}
            >
              <Pencil className="size-4" />
            </Button>
          </AppTooltip>
          <AppTooltip content={t("deleteCashbox")}>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label={t("deleteCashbox")}
              className="text-danger-fg hover:bg-danger-bg"
              onClick={() => setDeletingCashbox(row.original)}
            >
              <Trash2 className="size-4" />
            </Button>
          </AppTooltip>
        </div>
      ),
    },
  ];

  return (
    <>
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
              <div className="flex items-center gap-2">
                {row.isActive ? <StatusBadge tone="success" label={t("active")} /> : <StatusBadge tone="neutral" label={t("inactive")} />}
                <AppTooltip content={t("editCashbox")}>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label={t("editCashbox")}
                    className="max-md:min-h-11 max-md:min-w-11"
                    onClick={() => {
                      setEditingCashbox(row);
                      setFormOpen(true);
                    }}
                  >
                    <Pencil className="size-4" />
                  </Button>
                </AppTooltip>
                <AppTooltip content={t("deleteCashbox")}>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label={t("deleteCashbox")}
                    className="text-danger-fg max-md:min-h-11 max-md:min-w-11 hover:bg-danger-bg"
                    onClick={() => setDeletingCashbox(row)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </AppTooltip>
              </div>
            </div>
          </Card>
        )}
        emptyState={<EmptyState icon={<Wallet className="size-6" />} title={t("empty")} />}
        toolbar={
          <div className="flex justify-end p-3">
            <Button
              type="button"
              variant="primary"
              onClick={() => {
                setEditingCashbox(undefined);
                setFormOpen(true);
              }}
            >
              <Plus /> {t("newCashbox")}
            </Button>
          </div>
        }
      />

      <SettingsCashboxFormDialog open={formOpen} onOpenChange={setFormOpen} cashbox={editingCashbox} onSave={handleSave} />

      <ConfirmDialog
        open={!!deletingCashbox}
        onOpenChange={(open) => !open && setDeletingCashbox(undefined)}
        title={t("deleteDialogTitle", { name: deletingCashbox?.name ?? "" })}
        description={t("deleteDialogDescription")}
        confirmLabel={tCommon("delete")}
        cancelLabel={tCommon("cancel")}
        variant="destructive"
        onConfirm={handleDelete}
      />
    </>
  );
}
