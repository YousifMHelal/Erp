import { Lock, ShieldCheck } from "lucide-react";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { RoleRow } from "@/types";

export function RolesTable({ roles, selectedId, onSelect }: { roles: RoleRow[]; selectedId: string; onSelect: (id: string) => void }) {
  const t = useTranslations("settings.roles");

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      {roles.map((role) => (
        <button key={role.id} type="button" onClick={() => onSelect(role.id)} className="text-start">
          <Card className={selectedId === role.id ? "border-primary ring-1 ring-primary" : undefined}>
            <CardContent className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 font-medium">
                  <ShieldCheck className="size-4 text-muted-foreground" aria-hidden="true" />
                  {role.name}
                </span>
                {role.isSystem && (
                  <Badge variant="neutral" className="gap-1">
                    <Lock className="size-3" /> {t("systemRole")}
                  </Badge>
                )}
              </div>
              {role.description && <span className="text-body-sm text-muted-foreground">{role.description}</span>}
              <span className="text-caption text-muted-foreground">{t("userCount", { count: role.userCount })}</span>
            </CardContent>
          </Card>
        </button>
      ))}
    </div>
  );
}
