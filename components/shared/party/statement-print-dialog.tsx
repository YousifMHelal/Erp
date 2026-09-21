import { Printer } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { StatementPrintDialogProps } from "@/types";

export function StatementPrintDialog({ open, onOpenChange, onSelect }: StatementPrintDialogProps) {
  const t = useTranslations("parties.detail");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{t("printSizeTitle")}</DialogTitle>
          <DialogDescription>{t("printSizeDescription")}</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-2">
          <Button type="button" variant="outline" onClick={() => onSelect("A4")}>
            <Printer /> A4
          </Button>
          <Button type="button" variant="outline" onClick={() => onSelect("A5")}>
            <Printer /> A5
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
