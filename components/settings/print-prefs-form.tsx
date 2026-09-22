"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EntityCombobox } from "@/components/shared/entity-combobox";
import type { EntityComboboxOption, PrintPreferences } from "@/types";
import { savePrintPreferences } from "@/actions/settings.actions";

export function PrintPrefsForm({ preferences, cashboxOptions }: { preferences: PrintPreferences; cashboxOptions: EntityComboboxOption[] }) {
  const t = useTranslations("settings.printPrefs");
  const [size, setSize] = useState(preferences.defaultPrintSize);
  const [cashboxId, setCashboxId] = useState<string | undefined>(preferences.defaultCashboxId);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!cashboxId) return;
    const result = await savePrintPreferences({ defaultPrintSize: size, defaultCashboxId: cashboxId });
    if (!result.success) return toast.error(result.error);
    toast.success(t("saved"));
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label>{t("defaultSizeLabel")}</Label>
            <Select value={size} onValueChange={(v) => setSize(v as PrintPreferences["defaultPrintSize"])}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="A4">A4</SelectItem>
                <SelectItem value="A5">A5</SelectItem>
                <SelectItem value="80mm">80mm</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>{t("defaultCashboxLabel")}</Label>
            <EntityCombobox options={cashboxOptions} value={cashboxId} onChange={setCashboxId} className="sm:w-48" />
          </div>
          <Button type="submit" variant="accent" className="w-fit">
            {t("save")}
          </Button>
        </CardContent>
      </form>
    </Card>
  );
}
