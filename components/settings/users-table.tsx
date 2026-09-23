"use client";

import { useState } from "react";
import { Pencil, Trash2, UserPlus, UserX, Users } from "lucide-react";
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
import { UserFormDialog } from "@/components/settings/user-form-dialog";
import { formatDate } from "@/lib/format";
import type { EntityComboboxOption, SettingsUserRow } from "@/types";
import { deactivateUser, deleteUser } from "@/actions/settings.actions";

export function UsersTable({ users: initialUsers, roleOptions }: { users: SettingsUserRow[]; roleOptions: EntityComboboxOption[] }) {
  const t = useTranslations("settings.users");
  const tCommon = useTranslations("common");

  const [users, setUsers] = useState(initialUsers);
  const [formOpen, setFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<SettingsUserRow | undefined>(undefined);
  const [deactivatingUser, setDeactivatingUser] = useState<SettingsUserRow | undefined>(undefined);
  const [deletingUser, setDeletingUser] = useState<SettingsUserRow | undefined>(undefined);

  function handleSave(user: SettingsUserRow) {
    setUsers((prev) => (prev.some((u) => u.id === user.id) ? prev.map((u) => (u.id === user.id ? user : u)) : [...prev, user]));
  }

  async function handleDeactivate() {
    if (!deactivatingUser) return;
    const result = await deactivateUser(deactivatingUser.id);
    if (!result.success) return toast.error(result.error);
    setUsers((prev) => prev.map((u) => (u.id === deactivatingUser.id ? { ...u, isActive: false } : u)));
    toast.success(t("deactivateSuccess"));
    setDeactivatingUser(undefined);
  }

  async function handleDelete() {
    if (!deletingUser) return;
    const result = await deleteUser(deletingUser.id);
    if (!result.success) return toast.error(result.error);
    setUsers((prev) => prev.filter((u) => u.id !== deletingUser.id));
    toast.success(t("deleteSuccess"));
    setDeletingUser(undefined);
  }

  const columns: ColumnDef<SettingsUserRow, unknown>[] = [
    { accessorKey: "displayName", header: t("columnName") },
    { accessorKey: "username", header: t("columnUsername") },
    { accessorKey: "roleName", header: t("columnRole") },
    {
      accessorKey: "lastLoginAt",
      header: t("columnLastLogin"),
      cell: ({ getValue }) => {
        const value = getValue<string | undefined>();
        return <span className="tabular-nums">{value ? formatDate(value) : "—"}</span>;
      },
    },
    {
      accessorKey: "isActive",
      header: t("columnStatus"),
      cell: ({ getValue }) =>
        getValue<boolean>() ? (
          <StatusBadge tone="success" label={t("active")} />
        ) : (
          <StatusBadge tone="neutral" label={t("inactive")} />
        ),
    },
    {
      id: "actions",
      header: t("columnActions"),
      meta: { className: "text-end" },
      cell: ({ row }) => (
        <div className="flex items-center justify-end gap-1">
          <AppTooltip content={t("editUser")}>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label={t("editUser")}
              onClick={() => {
                setEditingUser(row.original);
                setFormOpen(true);
              }}
            >
              <Pencil className="size-4" />
            </Button>
          </AppTooltip>
          {row.original.isActive && (
            <AppTooltip content={t("deactivateUser")}>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label={t("deactivateUser")}
                className="text-danger-fg hover:bg-danger-bg"
                onClick={() => setDeactivatingUser(row.original)}
              >
                <UserX className="size-4" />
              </Button>
            </AppTooltip>
          )}
          <AppTooltip content={t("deleteUser")}>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label={t("deleteUser")}
              className="text-danger-fg hover:bg-danger-bg"
              onClick={() => setDeletingUser(row.original)}
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
        data={users}
        getRowId={(row) => row.id}
        renderMobileCard={(row) => (
          <Card>
            <div className="flex items-center justify-between gap-3 p-4">
              <div className="flex flex-col">
                <span className="font-medium">{row.displayName}</span>
                <span className="text-body-sm text-muted-foreground">{row.roleName}</span>
              </div>
              <div className="flex items-center gap-2">
                {row.isActive ? (
                  <StatusBadge tone="success" label={t("active")} />
                ) : (
                  <StatusBadge tone="neutral" label={t("inactive")} />
                )}
                <AppTooltip content={t("editUser")}>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label={t("editUser")}
                    className="max-md:min-h-11 max-md:min-w-11"
                    onClick={() => {
                      setEditingUser(row);
                      setFormOpen(true);
                    }}
                  >
                    <Pencil className="size-4" />
                  </Button>
                </AppTooltip>
                {row.isActive && (
                  <AppTooltip content={t("deactivateUser")}>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      aria-label={t("deactivateUser")}
                      className="text-danger-fg max-md:min-h-11 max-md:min-w-11 hover:bg-danger-bg"
                      onClick={() => setDeactivatingUser(row)}
                    >
                      <UserX className="size-4" />
                    </Button>
                  </AppTooltip>
                )}
                <AppTooltip content={t("deleteUser")}>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label={t("deleteUser")}
                    className="text-danger-fg max-md:min-h-11 max-md:min-w-11 hover:bg-danger-bg"
                    onClick={() => setDeletingUser(row)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </AppTooltip>
              </div>
            </div>
          </Card>
        )}
        emptyState={<EmptyState icon={<Users className="size-6" />} title={t("empty")} />}
        toolbar={
          <div className="flex justify-end p-3">
            <Button
              type="button"
              variant="primary"
              onClick={() => {
                setEditingUser(undefined);
                setFormOpen(true);
              }}
            >
              <UserPlus /> {t("newUser")}
            </Button>
          </div>
        }
      />

      <UserFormDialog
        key={editingUser?.id ?? "new"}
        open={formOpen}
        onOpenChange={setFormOpen}
        roleOptions={roleOptions}
        user={editingUser}
        onSave={handleSave}
      />

      <ConfirmDialog
        open={!!deactivatingUser}
        onOpenChange={(open) => !open && setDeactivatingUser(undefined)}
        title={t("deactivateDialogTitle", { name: deactivatingUser?.displayName ?? "" })}
        description={t("deactivateDialogDescription")}
        confirmLabel={tCommon("confirm")}
        cancelLabel={tCommon("cancel")}
        variant="destructive"
        onConfirm={handleDeactivate}
      />

      <ConfirmDialog
        open={!!deletingUser}
        onOpenChange={(open) => !open && setDeletingUser(undefined)}
        title={t("deleteDialogTitle", { name: deletingUser?.displayName ?? "" })}
        description={t("deleteDialogDescription")}
        confirmLabel={tCommon("delete")}
        cancelLabel={tCommon("cancel")}
        variant="destructive"
        onConfirm={handleDelete}
      />
    </>
  );
}
