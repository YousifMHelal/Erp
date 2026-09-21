"use client";

import { UserPlus, Users } from "lucide-react";
import { useTranslations } from "next-intl";
import type { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DataTable } from "@/components/shared/data-table/data-table";
import { EmptyState } from "@/components/shared/empty-state";
import { StatusBadge } from "@/components/shared/status-badge";
import { formatDate } from "@/lib/format";
import type { SettingsUserRow } from "@/types";

export function UsersTable({ users }: { users: SettingsUserRow[] }) {
  const t = useTranslations("settings.users");

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
  ];

  return (
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
            {row.isActive ? (
              <StatusBadge tone="success" label={t("active")} />
            ) : (
              <StatusBadge tone="neutral" label={t("inactive")} />
            )}
          </div>
        </Card>
      )}
      emptyState={<EmptyState icon={<Users className="size-6" />} title={t("empty")} />}
      toolbar={
        <div className="flex justify-end p-3">
          <Button type="button" variant="primary">
            <UserPlus /> {t("newUser")}
          </Button>
        </div>
      }
    />
  );
}
