import { CheckCircle2, Printer } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { SaveInvoiceDialogProps } from "@/types";

export function SaveInvoiceDialog({ open, onOpenChange, invoiceNumber, onPrint, onSkip }: SaveInvoiceDialogProps) {
  const t = useTranslations("sales.new");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="items-center text-center">
          <span className="flex size-12 items-center justify-center rounded-full bg-success-bg text-success-fg">
            <CheckCircle2 className="size-6" />
          </span>
          <DialogTitle>{t("savedTitle", { number: invoiceNumber })}</DialogTitle>
          <DialogDescription>{t("savedDescription")}</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-3 gap-2">
          <Button type="button" variant="outline" onClick={() => onPrint("A4")}>
            <Printer /> A4
          </Button>
          <Button type="button" variant="outline" onClick={() => onPrint("A5")}>
            <Printer /> A5
          </Button>
          <Button type="button" variant="outline" onClick={() => onPrint("80mm")}>
            <Printer /> 80mm
          </Button>
        </div>
        <DialogFooter>
          <Button type="button" variant="ghost" onClick={onSkip} className="w-full">
            {t("skipPrint")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
