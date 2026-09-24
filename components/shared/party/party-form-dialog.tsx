"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useMediaQuery } from "@/hooks/use-media-query";
import { createPartySchema, updatePartySchema } from "@/lib/validations";
import type { PartyFormDialogProps } from "@/types";

export function PartyFormDialog({ partyType, open, onOpenChange, party, onSave }: PartyFormDialogProps) {
  const t = useTranslations("parties.form");
  const isEdit = !!party;
  const isDesktop = useMediaQuery("(min-width: 768px)");

  const [name, setName] = useState(party?.name ?? "");
  const [phone, setPhone] = useState(party?.phone ?? "");
  const [address, setAddress] = useState(party?.address ?? "");
  const [openingBalance, setOpeningBalance] = useState(party?.openingBalance ?? "0");
  const [notes, setNotes] = useState(party?.notes ?? "");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setName(party?.name ?? "");
    setPhone(party?.phone ?? "");
    setAddress(party?.address ?? "");
    setOpeningBalance(party?.openingBalance ?? "0");
    setNotes(party?.notes ?? "");
  }, [open, party]);

  const titleKey = isEdit ? (partyType === "CUSTOMER" ? "editCustomerTitle" : "editSupplierTitle") : partyType === "CUSTOMER" ? "createCustomerTitle" : "createSupplierTitle";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const values = { name, phone, address, openingBalance, notes };
    const parsed = isEdit ? updatePartySchema.safeParse(values) : createPartySchema.safeParse(values);
    if (!parsed.success) return toast.error(parsed.error.issues[0]?.message ?? t("errorRequired"));
    setSaving(true);
    try {
      if (await onSave(values)) {
        toast.success(isEdit ? t("updateSuccess") : t("createSuccess"));
        onOpenChange(false);
      }
    } finally {
      setSaving(false);
    }
  }

  const title = t(titleKey);

  const form = (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="party-name">
          {t("nameLabel")} <span className="text-accent">*</span>
        </Label>
        <Input id="party-name" value={name} onChange={(e) => setName(e.target.value)} placeholder={t("namePlaceholder")} autoComplete="off" />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="party-phone">{t("phoneLabel")}</Label>
        <Input
          id="party-phone"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          inputMode="tel"
          placeholder="٠١٠xxxxxxxx"
          className="text-end tabular-nums"
          dir="ltr"
          autoComplete="off"
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="party-address">{t("addressLabel")}</Label>
        <Input id="party-address" value={address} onChange={(e) => setAddress(e.target.value)} placeholder={t("addressPlaceholder")} autoComplete="off" />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="party-opening-balance">{t("openingBalanceLabel")}</Label>
        <Input
          id="party-opening-balance"
          type="number"
          inputMode="decimal"
          step="any"
          value={openingBalance}
          onChange={(e) => setOpeningBalance(e.target.value)}
          className="text-end tabular-nums"
          placeholder="0.00"
          disabled={isEdit}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="party-notes">{t("notesLabel")}</Label>
        <Textarea id="party-notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder={t("notesPlaceholder")} rows={2} />
      </div>

      {isDesktop ? (
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            {t("cancel")}
          </Button>
          <Button type="submit" variant="accent" disabled={saving}>
            {t("save")}
          </Button>
        </DialogFooter>
      ) : (
        <SheetFooter>
          <Button type="submit" variant="accent" disabled={saving}>
            {t("save")}
          </Button>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            {t("cancel")}
          </Button>
        </SheetFooter>
      )}
    </form>
  );

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
          </DialogHeader>
          {form}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[90vh] overflow-y-auto rounded-t-lg">
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
        </SheetHeader>
        <div className="px-4 pb-4">{form}</div>
      </SheetContent>
    </Sheet>
  );
}
