"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useMediaQuery } from "@/hooks/use-media-query";
import type { ConfirmDialogProps } from "@/types";

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  cancelLabel,
  variant = "default",
  isPending,
  onConfirm,
}: ConfirmDialogProps) {
  const t = useTranslations("common");
  const isDesktop = useMediaQuery("(min-width: 768px)");

  const confirmButton = (
    <Button
      type="button"
      variant={variant === "destructive" ? "destructive" : "primary"}
      disabled={isPending}
      onClick={onConfirm}
      className="w-full sm:w-auto"
    >
      {confirmLabel ?? t("confirm")}
    </Button>
  );

  const cancelButton = (
    <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="w-full sm:w-auto">
      {cancelLabel ?? t("cancel")}
    </Button>
  );

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            {cancelButton}
            {confirmButton}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-lg">
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
          <SheetDescription>{description}</SheetDescription>
        </SheetHeader>
        <SheetFooter>
          {confirmButton}
          {cancelButton}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
