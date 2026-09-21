import { useTranslations } from "next-intl";
import { Checkbox } from "@/components/ui/checkbox";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { PermissionMatrixProps } from "@/types";

export function PermissionMatrix({ groups, grantedKeys, onToggle, readOnly }: PermissionMatrixProps) {
  const t = useTranslations();

  return (
    <Card className="overflow-hidden p-0">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader className="bg-muted">
            <TableRow className="hover:bg-transparent">
              <TableHead className="text-label">{t("settings.roles.groupColumn")}</TableHead>
              <TableHead className="text-label" colSpan={99}>
                {t("settings.roles.actionsColumn")}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {groups.map((group) => (
              <TableRow key={group.key}>
                <TableCell className="font-medium">{t(group.labelKey)}</TableCell>
                <TableCell colSpan={99}>
                  <div className="flex flex-wrap gap-4">
                    {group.actions.map((action) => (
                      <label key={action.key} className="group/field-label flex items-center gap-2">
                        <Checkbox
                          checked={grantedKeys.has(action.key)}
                          onCheckedChange={() => onToggle(action.key)}
                          disabled={readOnly}
                        />
                        <span className="text-body-sm">{t(action.labelKey)}</span>
                      </label>
                    ))}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}
