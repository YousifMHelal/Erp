"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import type { SettingsCashboxFormDialogProps } from "@/types";
import { saveSettingsCashbox } from "@/actions/settings.actions";

export function SettingsCashboxFormDialog({ open, onOpenChange, cashbox, onSave }: SettingsCashboxFormDialogProps) {
  const t = useTranslations("settings.cashboxes.form");
  const isEdit = !!cashbox;

  const [name, setName] = useState(cashbox?.name ?? "");
  const [description, setDescription] = useState(cashbox?.description ?? "");
  const [isActive, setIsActive] = useState(cashbox?.isActive ?? true);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      toast.error(t("errorRequired"));
      return;
    }
    const saved = await saveSettingsCashbox(cashbox?.id, { name, description, isActive });
    if (!saved.success) return toast.error(saved.error);
    onSave(saved.data);
    toast.success(isEdit ? t("updateSuccess") : t("createSuccess"));
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? t("editTitle") : t("createTitle")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="cashbox-name">
              {t("nameLabel")} <span className="text-accent">*</span>
            </Label>
            <Input
              id="cashbox-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("namePlaceholder")}
              autoComplete="off"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="cashbox-description">{t("descriptionLabel")}</Label>
            <Input
              id="cashbox-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t("descriptionPlaceholder")}
              autoComplete="off"
            />
          </div>
          <div className="flex items-center justify-between gap-3">
            <Label htmlFor="cashbox-active">{t("statusLabel")}</Label>
            <Switch id="cashbox-active" checked={isActive} onCheckedChange={setIsActive} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t("cancel")}
            </Button>
            <Button type="submit" variant="accent">
              {t("save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
