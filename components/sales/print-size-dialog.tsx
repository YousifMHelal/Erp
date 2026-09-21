import { Printer } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { PrintSizeDialogProps } from "@/types";

export function PrintSizeDialog({ open, onOpenChange, onSelect }: PrintSizeDialogProps) {
  const t = useTranslations("sales.detail");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{t("printSizeTitle")}</DialogTitle>
          <DialogDescription>{t("printSizeDescription")}</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-3 gap-2">
          <Button type="button" variant="outline" onClick={() => onSelect("A4")}>
            <Printer /> A4
          </Button>
          <Button type="button" variant="outline" onClick={() => onSelect("A5")}>
            <Printer /> A5
          </Button>
          <Button type="button" variant="outline" onClick={() => onSelect("80mm")}>
            <Printer /> 80mm
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
