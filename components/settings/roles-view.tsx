"use client";

import { useMemo, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { RolesTable } from "@/components/settings/roles-table";
import { PermissionMatrix } from "@/components/settings/permission-matrix";
import { PERMISSION_GROUPS } from "@/lib/permissions";
import { saveRole } from "@/actions/settings.actions";
import type { RoleRow } from "@/types";

export function RolesView({ roles: initialRoles }: { roles: RoleRow[] }) {
  const t = useTranslations("settings.roles");
  const tCommon = useTranslations("common");
  const [roles, setRoles] = useState(initialRoles);
  const [selectedId, setSelectedId] = useState(roles[0]?.id ?? "");
  const [isPending, startTransition] = useTransition();
  const selectedRole = roles.find((r) => r.id === selectedId);
  const [draftPermissions, setDraftPermissions] = useState<Set<string>>(
    () => new Set(selectedRole?.permissions ?? []),
  );
  const [draftForId, setDraftForId] = useState(selectedId);

  const grantedKeys = useMemo(() => {
    if (draftForId === selectedId) return draftPermissions;
    return new Set(selectedRole?.permissions ?? []);
  }, [draftForId, selectedId, draftPermissions, selectedRole]);

  function selectRole(id: string) {
    setSelectedId(id);
    setDraftForId(id);
    setDraftPermissions(new Set(roles.find((r) => r.id === id)?.permissions ?? []));
  }

  function togglePermission(key: string) {
    setDraftForId(selectedId);
    setDraftPermissions((prev) => {
      const current = new Set(prev);
      if (current.has(key)) current.delete(key);
      else current.add(key);
      return current;
    });
  }

  function handleSave() {
    if (!selectedRole) return;
    startTransition(async () => {
      const result = await saveRole(selectedRole.id, {
        name: selectedRole.name,
        description: selectedRole.description,
        permissions: Array.from(grantedKeys),
      });
      if (!result.success) { toast.error(result.error); return; }
      setRoles((prev) => prev.map((role) => (role.id === result.data.id ? result.data : role)));
      toast.success(t("saveSuccess"));
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <RolesTable roles={roles} selectedId={selectedId} onSelect={selectRole} />
      {selectedRole && (
        <>
          <PermissionMatrix
            groups={PERMISSION_GROUPS}
            grantedKeys={grantedKeys}
            onToggle={togglePermission}
            readOnly={selectedRole.isSystem}
          />
          {!selectedRole.isSystem && (
            <Button type="button" variant="accent" className="w-fit" disabled={isPending} onClick={handleSave}>
              {isPending ? tCommon("saving") : t("saveMatrix")}
            </Button>
          )}
        </>
      )}
    </div>
  );
}
