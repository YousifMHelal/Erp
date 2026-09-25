"use client";

import { useState } from "react";
import { FolderTree, Pencil, Plus, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import type { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DataTable } from "@/components/shared/data-table/data-table";
import { EmptyState } from "@/components/shared/empty-state";
import { AppTooltip } from "@/components/shared/app-tooltip";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { CategoryFormDialog } from "@/components/settings/category-form-dialog";
import { formatNumber } from "@/lib/format";
import type { CategoryRow } from "@/types";
import { deleteCategory } from "@/actions/settings.actions";

export function CategoriesTable({ categories: initialCategories }: { categories: CategoryRow[] }) {
  const t = useTranslations("settings.categories");
  const tCommon = useTranslations("common");

  const [categories, setCategories] = useState(initialCategories);
  const [formOpen, setFormOpen] = useState(false);
  // Bumped on every open so the form dialog remounts with fresh fields, even for back-to-back "new" entries.
  const [formSession, setFormSession] = useState(0);
  const [editingCategory, setEditingCategory] = useState<CategoryRow | undefined>(undefined);
  const [deletingCategory, setDeletingCategory] = useState<CategoryRow | undefined>(undefined);

  function handleSave(category: CategoryRow) {
    setCategories((prev) =>
      prev.some((c) => c.id === category.id) ? prev.map((c) => (c.id === category.id ? category : c)) : [...prev, category],
    );
  }

  async function handleDelete() {
    if (!deletingCategory) return;
    const result = await deleteCategory(deletingCategory.id);
    if (!result.success) return toast.error(result.error);
    setCategories((prev) => prev.filter((c) => c.id !== deletingCategory.id));
    toast.success(t("deleteSuccess"));
    setDeletingCategory(undefined);
  }

  const columns: ColumnDef<CategoryRow, unknown>[] = [
    { accessorKey: "name", header: t("columnName") },
    { accessorKey: "description", header: t("columnDescription"), cell: ({ getValue }) => getValue<string>() || "—" },
    {
      accessorKey: "productCount",
      header: t("columnProductCount"),
      cell: ({ getValue }) => <span className="tabular-nums">{formatNumber(getValue<number>())}</span>,
    },
    {
      id: "actions",
      header: t("columnActions"),
      meta: { className: "text-end" },
      cell: ({ row }) => (
        <div className="flex items-center justify-end gap-1">
          <AppTooltip content={t("editCategory")}>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label={t("editCategory")}
              onClick={() => {
                setEditingCategory(row.original);
                setFormSession((session) => session + 1);
                setFormOpen(true);
              }}
            >
              <Pencil className="size-4" />
            </Button>
          </AppTooltip>
          <AppTooltip content={t("deleteCategory")}>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label={t("deleteCategory")}
              className="text-danger-fg hover:bg-danger-bg"
              onClick={() => setDeletingCategory(row.original)}
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
        data={categories}
        getRowId={(row) => row.id}
        renderMobileCard={(row) => (
          <Card>
            <div className="flex items-center justify-between gap-3 p-4">
              <div className="flex flex-col">
                <span className="font-medium">{row.name}</span>
                {row.description && <span className="text-body-sm text-muted-foreground">{row.description}</span>}
              </div>
              <div className="flex items-center gap-2">
                <span className="tabular-nums text-body-sm text-muted-foreground">{formatNumber(row.productCount)}</span>
                <AppTooltip content={t("editCategory")}>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label={t("editCategory")}
                    className="max-md:min-h-11 max-md:min-w-11"
                    onClick={() => {
                      setEditingCategory(row);
                      setFormSession((session) => session + 1);
                      setFormOpen(true);
                    }}
                  >
                    <Pencil className="size-4" />
                  </Button>
                </AppTooltip>
                <AppTooltip content={t("deleteCategory")}>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label={t("deleteCategory")}
                    className="text-danger-fg max-md:min-h-11 max-md:min-w-11 hover:bg-danger-bg"
                    onClick={() => setDeletingCategory(row)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </AppTooltip>
              </div>
            </div>
          </Card>
        )}
        emptyState={<EmptyState icon={<FolderTree className="size-6" />} title={t("empty")} />}
        toolbar={
          <div className="flex justify-end p-3">
            <Button
              type="button"
              variant="primary"
              onClick={() => {
                setEditingCategory(undefined);
                setFormSession((session) => session + 1);
                setFormOpen(true);
              }}
            >
              <Plus /> {t("newCategory")}
            </Button>
          </div>
        }
      />

      <CategoryFormDialog key={`${editingCategory?.id ?? "new"}-${formSession}`} open={formOpen} onOpenChange={setFormOpen} category={editingCategory} onSave={handleSave} />

      <ConfirmDialog
        open={!!deletingCategory}
        onOpenChange={(open) => !open && setDeletingCategory(undefined)}
        title={t("deleteDialogTitle", { name: deletingCategory?.name ?? "" })}
        description={t("deleteDialogDescription")}
        confirmLabel={tCommon("delete")}
        cancelLabel={tCommon("cancel")}
        variant="destructive"
        onConfirm={handleDelete}
      />
    </>
  );
}
