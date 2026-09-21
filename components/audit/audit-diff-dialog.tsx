import { useTranslations } from "next-intl";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { AuditDiffDialogProps } from "@/types";

export function AuditDiffDialog({ open, onOpenChange, entry }: AuditDiffDialogProps) {
  const t = useTranslations("auditLog");

  const fields = entry ? diffFields(entry.beforeJson, entry.afterJson) : [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{entry ? t("diffTitle", { entity: entry.entityLabel }) : ""}</DialogTitle>
        </DialogHeader>
        {fields.length === 0 ? (
          <p className="text-body-sm text-muted-foreground">{t("diffEmpty")}</p>
        ) : (
          <Table>
            <TableHeader className="bg-muted">
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-label">{t("columnField")}</TableHead>
                <TableHead className="text-label">{t("columnOldValue")}</TableHead>
                <TableHead className="text-label">{t("columnNewValue")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {fields.map((field) => (
                <TableRow key={field.key}>
                  <TableCell className="font-medium">{field.key}</TableCell>
                  <TableCell className="text-muted-foreground line-through">{field.before}</TableCell>
                  <TableCell className="font-medium">{field.after}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </DialogContent>
    </Dialog>
  );
}

function diffFields(before?: Record<string, unknown>, after?: Record<string, unknown>) {
  const keys = new Set([...Object.keys(before ?? {}), ...Object.keys(after ?? {})]);
  return Array.from(keys)
    .filter((key) => JSON.stringify(before?.[key]) !== JSON.stringify(after?.[key]))
    .map((key) => ({
      key,
      before: formatValue(before?.[key]),
      after: formatValue(after?.[key]),
    }));
}

function formatValue(value: unknown): string {
  if (value === undefined || value === null) return "—";
  return String(value);
}
