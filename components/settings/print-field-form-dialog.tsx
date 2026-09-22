"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { PrintFieldFormDialogProps, PrintSystemFieldKey } from "@/types";

export function PrintFieldFormDialog({
  open,
  onOpenChange,
  systemFieldOptions,
  editingItem,
  onAddSystemField,
  onAddCustomField,
  onEditSystemField,
  onEditCustomField,
}: PrintFieldFormDialogProps) {
  const t = useTranslations("settings.printTemplate");
  const tGlobal = useTranslations();
  const isEdit = !!editingItem;

  const [tab, setTab] = useState<"system" | "custom">("system");
  const [systemFieldKey, setSystemFieldKey] = useState<PrintSystemFieldKey | undefined>(systemFieldOptions[0]?.key);
  const [systemFieldLabel, setSystemFieldLabel] = useState(
    systemFieldOptions[0] ? tGlobal(systemFieldOptions[0].labelKey) : "",
  );
  const [customLabel, setCustomLabel] = useState("");
  const [customValue, setCustomValue] = useState("");

  // Re-seed the form whenever the dialog opens, either from the field being edited or the blank defaults.
  useEffect(() => {
    if (!open) return;
    if (editingItem) {
      if (editingItem.source.kind === "system") {
        setTab("system");
        setSystemFieldKey(editingItem.source.fieldKey);
        setSystemFieldLabel(editingItem.label);
      } else {
        setTab("custom");
        setCustomLabel(editingItem.label);
        setCustomValue(editingItem.source.value);
      }
    } else {
      const firstOption = systemFieldOptions[0];
      setTab("system");
      setSystemFieldKey(firstOption?.key);
      setSystemFieldLabel(firstOption ? tGlobal(firstOption.labelKey) : "");
      setCustomLabel("");
      setCustomValue("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- re-seeding should only re-run when the dialog opens or which field is being edited changes
  }, [open, editingItem?.id]);

  function handleSystemFieldChange(fieldKey: PrintSystemFieldKey) {
    setSystemFieldKey(fieldKey);
    const option = systemFieldOptions.find((o) => o.key === fieldKey);
    setSystemFieldLabel(option ? tGlobal(option.labelKey) : "");
  }

  function handleConfirm() {
    if (tab === "system") {
      if (!systemFieldKey) return;
      if (isEdit) onEditSystemField(systemFieldKey, systemFieldLabel.trim());
      else onAddSystemField(systemFieldKey, systemFieldLabel.trim());
    } else {
      if (!customValue.trim()) return;
      if (isEdit) onEditCustomField(customLabel.trim(), customValue.trim());
      else onAddCustomField(customLabel.trim(), customValue.trim());
    }
    onOpenChange(false);
  }

  const canConfirm = tab === "system" ? !!systemFieldKey : customValue.trim().length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? t("editFieldDialogTitle") : t("addFieldDialogTitle")}</DialogTitle>
        </DialogHeader>

        <Tabs value={tab} onValueChange={(v) => setTab(v as "system" | "custom")}>
          <TabsList className="w-full">
            <TabsTrigger value="system" className="flex-1">
              {t("addFieldTabSystem")}
            </TabsTrigger>
            <TabsTrigger value="custom" className="flex-1">
              {t("addFieldTabCustom")}
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {tab === "system" ? (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="print-field-system-label">{t("customLabelLabel")}</Label>
              <Input
                id="print-field-system-label"
                value={systemFieldLabel}
                onChange={(e) => setSystemFieldLabel(e.target.value)}
                placeholder={t("customLabelPlaceholder")}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="print-field-system-select">{t("systemFieldLabel")}</Label>
              <Select value={systemFieldKey} onValueChange={(v) => handleSystemFieldChange(v as PrintSystemFieldKey)}>
                <SelectTrigger id="print-field-system-select" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {systemFieldOptions.map((option) => (
                    <SelectItem key={option.key} value={option.key}>
                      {tGlobal(option.labelKey)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="print-field-custom-label">{t("customLabelLabel")}</Label>
              <Input
                id="print-field-custom-label"
                value={customLabel}
                onChange={(e) => setCustomLabel(e.target.value)}
                placeholder={t("customLabelPlaceholder")}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="print-field-custom-value">{t("customValueLabel")}</Label>
              <Input
                id="print-field-custom-value"
                value={customValue}
                onChange={(e) => setCustomValue(e.target.value)}
                placeholder={t("customValuePlaceholder")}
              />
            </div>
          </div>
        )}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            {t("cancel")}
          </Button>
          <Button type="button" variant="accent" onClick={handleConfirm} disabled={!canConfirm}>
            {isEdit ? t("saveFieldConfirm") : t("addFieldConfirm")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
