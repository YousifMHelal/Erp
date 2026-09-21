import { Printer } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useMediaQuery } from "@/hooks/use-media-query";
import type { StatementPrintDialogProps } from "@/types";

export function StatementPrintDialog({ open, onOpenChange, onSelect }: StatementPrintDialogProps) {
  const t = useTranslations("parties.detail");
  const isDesktop = useMediaQuery("(min-width: 768px)");

  const sizeButtons = (
    <div className="grid grid-cols-2 gap-2">
      <Button type="button" variant="outline" className="max-md:min-h-11" onClick={() => onSelect("A4")}>
        <Printer /> A4
      </Button>
      <Button type="button" variant="outline" className="max-md:min-h-11" onClick={() => onSelect("A5")}>
        <Printer /> A5
      </Button>
    </div>
  );

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{t("printSizeTitle")}</DialogTitle>
            <DialogDescription>{t("printSizeDescription")}</DialogDescription>
          </DialogHeader>
          {sizeButtons}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-lg">
        <SheetHeader>
          <SheetTitle>{t("printSizeTitle")}</SheetTitle>
          <SheetDescription>{t("printSizeDescription")}</SheetDescription>
        </SheetHeader>
        <div className="px-4 pb-4">{sizeButtons}</div>
      </SheetContent>
    </Sheet>
  );
}
