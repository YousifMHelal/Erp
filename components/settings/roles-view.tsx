"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { RolesTable } from "@/components/settings/roles-table";
import { PermissionMatrix } from "@/components/settings/permission-matrix";
import { PERMISSION_GROUPS } from "@/components/settings/permission-catalogue";
import type { RoleRow } from "@/types";

const ROLE_PERMISSIONS: Record<string, string[]> = {
  "1": PERMISSION_GROUPS.flatMap((g) => g.actions.map((a) => a.key)),
  "2": ["sale.view", "sale.create", "purchase.view", "customer.view", "supplier.view", "report.view", "report.profitLoss", "cashbox.view"],
  "3": ["sale.view", "sale.create", "sale.print", "customer.view"],
};

export function RolesView({ roles }: { roles: RoleRow[] }) {
  const t = useTranslations("settings.roles");
  const [selectedId, setSelectedId] = useState(roles[0]?.id ?? "");
  const [permissions, setPermissions] = useState<Record<string, Set<string>>>(() =>
    Object.fromEntries(Object.entries(ROLE_PERMISSIONS).map(([id, keys]) => [id, new Set(keys)])),
  );

  const selectedRole = roles.find((r) => r.id === selectedId);
  const grantedKeys = useMemo(() => permissions[selectedId] ?? new Set<string>(), [permissions, selectedId]);

  function togglePermission(key: string) {
    setPermissions((prev) => {
      const current = new Set(prev[selectedId] ?? []);
      if (current.has(key)) current.delete(key);
      else current.add(key);
      return { ...prev, [selectedId]: current };
    });
  }

  function handleSave() {
    toast.success(t("saveSuccess"));
    // P7-9 wires this to roles.actions.ts.
  }

  return (
    <div className="flex flex-col gap-4">
      <RolesTable roles={roles} selectedId={selectedId} onSelect={setSelectedId} />
      {selectedRole && (
        <>
          <PermissionMatrix
            groups={PERMISSION_GROUPS}
            grantedKeys={grantedKeys}
            onToggle={togglePermission}
            readOnly={selectedRole.isSystem}
          />
          {!selectedRole.isSystem && (
            <Button type="button" variant="accent" className="w-fit" onClick={handleSave}>
              {t("saveMatrix")}
            </Button>
          )}
        </>
      )}
    </div>
  );
}
