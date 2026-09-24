"use client";

import { useRef, useState } from "react";
import { ImagePlus, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { PrintLineColumnList } from "@/components/settings/print-line-column-list";
import { PrintFieldEditorList } from "@/components/settings/print-field-editor-list";
import { PrintTotalsRowList } from "@/components/settings/print-totals-row-list";
import { PrintTemplatePreview } from "@/components/settings/print-template-preview";
import { PRINT_SYSTEM_FIELD_OPTIONS, createFieldId, moveFieldItem, moveTotalsRow, updateInfoColumn } from "@/lib/print-fields";
import type {
  PrintFieldItem,
  PrintInfoColumnKey,
  PrintLineColumnKey,
  PrintSystemFieldKey,
  PrintTemplateFormProps,
  PrintTemplateSettings,
  PrintTotalsRowKey,
} from "@/types";

function moveColumn(
  columns: PrintTemplateSettings["lineColumns"],
  key: PrintLineColumnKey,
  direction: "up" | "down",
): PrintTemplateSettings["lineColumns"] {
  const index = columns.findIndex((c) => c.key === key);
  const swapWith = direction === "up" ? index - 1 : index + 1;
  if (index < 0 || swapWith < 0 || swapWith >= columns.length) return columns;
  const current = columns[index];
  const target = columns[swapWith];
  if (!current || !target) return columns;
  const next = [...columns];
  next[index] = target;
  next[swapWith] = current;
  return next;
}

export function PrintTemplateForm({ template }: PrintTemplateFormProps) {
  const t = useTranslations("settings.printTemplate");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [templateName, setTemplateName] = useState(template.templateName);
  const [name, setName] = useState(template.shop.name);
  const [phone, setPhone] = useState(template.shop.phone);
  const [phone2, setPhone2] = useState(template.shop.phone2 ?? "");
  const [address, setAddress] = useState(template.shop.address);
  const [invoiceFooter, setInvoiceFooter] = useState(template.shop.invoiceFooter ?? "");
  const [logoDataUrl, setLogoDataUrl] = useState<string | undefined>(template.shop.logoDataUrl);
  const [lineColumns, setLineColumns] = useState(template.lineColumns);
  const [infoColumns, setInfoColumns] = useState(template.infoColumns);
  const [totalsRows, setTotalsRows] = useState(template.totalsRows);
  const [previewSize, setPreviewSize] = useState<"A4" | "A5" | "80mm">("A4");

  function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setLogoDataUrl(reader.result as string);
    reader.readAsDataURL(file);
    e.target.value = "";
  }

  function handleToggleColumn(key: PrintLineColumnKey) {
    setLineColumns((prev) => prev.map((c) => (c.key === key ? { ...c, visible: !c.visible } : c)));
  }

  function handleMoveColumn(key: PrintLineColumnKey, direction: "up" | "down") {
    setLineColumns((prev) => moveColumn(prev, key, direction));
  }

  function handleToggleTotalsRow(key: PrintTotalsRowKey) {
    setTotalsRows((prev) => prev.map((row) => (row.key === key ? { ...row, visible: !row.visible } : row)));
  }

  function handleMoveTotalsRow(key: PrintTotalsRowKey, direction: "up" | "down") {
    setTotalsRows((prev) => moveTotalsRow(prev, key, direction));
  }

  function handleUpdateTotalsRowLabel(key: PrintTotalsRowKey, label: string) {
    setTotalsRows((prev) => prev.map((row) => (row.key === key ? { ...row, label } : row)));
  }

  function handleAddSystemField(column: PrintInfoColumnKey, fieldKey: PrintSystemFieldKey, label: string) {
    const item: PrintFieldItem = { id: createFieldId(), label, source: { kind: "system", fieldKey } };
    setInfoColumns((prev) => updateInfoColumn(prev, column, (items) => [...items, item]));
  }

  function handleAddCustomField(column: PrintInfoColumnKey, label: string, value: string) {
    const item: PrintFieldItem = { id: createFieldId(), label, source: { kind: "custom", value } };
    setInfoColumns((prev) => updateInfoColumn(prev, column, (items) => [...items, item]));
  }

  function handleEditSystemField(column: PrintInfoColumnKey, id: string, fieldKey: PrintSystemFieldKey, label: string) {
    setInfoColumns((prev) =>
      updateInfoColumn(prev, column, (items) =>
        items.map((i) => (i.id === id ? { ...i, label, source: { kind: "system", fieldKey } } : i)),
      ),
    );
  }

  function handleEditCustomField(column: PrintInfoColumnKey, id: string, label: string, value: string) {
    setInfoColumns((prev) =>
      updateInfoColumn(prev, column, (items) =>
        items.map((i) => (i.id === id ? { ...i, label, source: { kind: "custom", value } } : i)),
      ),
    );
  }

  function handleRemoveField(column: PrintInfoColumnKey, id: string) {
    setInfoColumns((prev) => updateInfoColumn(prev, column, (items) => items.filter((i) => i.id !== id)));
  }

  function handleMoveField(column: PrintInfoColumnKey, id: string, direction: "up" | "down") {
    setInfoColumns((prev) => updateInfoColumn(prev, column, (items) => moveFieldItem(items, id, direction)));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    toast.success(t("saved"));
    // P7-9 wires this to settings.actions.ts.
  }

  const currentTemplate: PrintTemplateSettings = {
    templateName,
    shop: { name, phone, phone2: phone2 || undefined, address, invoiceFooter, logoDataUrl },
    lineColumns,
    infoColumns,
    totalsRows,
  };

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:items-start">
      <div className="flex flex-col gap-4">
        <Card>
          <CardHeader>
            <CardTitle>{t("title")}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="template-name">{t("templateNameLabel")}</Label>
              <Input
                id="template-name"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                placeholder={t("templateNamePlaceholder")}
                autoComplete="off"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>{t("logoTitle")}</Label>
              <div className="flex items-center gap-3">
                <Avatar className="size-16 rounded-md border border-border">
                  <AvatarImage src={logoDataUrl} alt={name} className="object-contain" />
                  <AvatarFallback className="rounded-md">
                    <ImagePlus className="size-5 text-muted-foreground" aria-hidden="true" />
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                      {t("logoLabel")}
                    </Button>
                    {logoDataUrl && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        aria-label={t("logoRemove")}
                        onClick={() => setLogoDataUrl(undefined)}
                      >
                        <X className="size-4" />
                      </Button>
                    )}
                  </div>
                  <span className="text-caption text-muted-foreground">{t("logoHint")}</span>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={handleLogoChange}
                  aria-label={t("logoLabel")}
                />
              </div>
            </div>

            <div className="flex flex-col gap-3 border-t border-border pt-4">
              <span className="text-label font-medium text-foreground">{t("companyInfoTitle")}</span>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="template-shop-name">{t("nameLabel")}</Label>
                <Input id="template-shop-name" value={name} onChange={(e) => setName(e.target.value)} autoComplete="off" />
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="template-shop-phone">{t("phoneLabel")}</Label>
                  <Input
                    id="template-shop-phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="٠١٠xxxxxxxx"
                    dir="ltr"
                    className="text-end tabular-nums"
                    autoComplete="off"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="template-shop-phone2">{t("phone2Label")}</Label>
                  <Input
                    id="template-shop-phone2"
                    value={phone2}
                    onChange={(e) => setPhone2(e.target.value)}
                    placeholder="٠١٠xxxxxxxx"
                    dir="ltr"
                    className="text-end tabular-nums"
                    autoComplete="off"
                  />
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="template-shop-address">{t("addressLabel")}</Label>
                <Input id="template-shop-address" value={address} onChange={(e) => setAddress(e.target.value)} autoComplete="off" />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="template-footer">{t("footerLabel")}</Label>
                <Textarea
                  id="template-footer"
                  value={invoiceFooter}
                  onChange={(e) => setInvoiceFooter(e.target.value)}
                  placeholder={t("footerPlaceholder")}
                  rows={2}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("columnsTitle")}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <p className="text-body-sm text-muted-foreground">{t("columnsHint")}</p>
            <PrintLineColumnList columns={lineColumns} onToggle={handleToggleColumn} onMove={handleMoveColumn} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("infoColumnsTitle")}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <p className="text-body-sm text-muted-foreground">{t("infoColumnsHint")}</p>
            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-2">
                <span className="text-label font-medium text-foreground">{t("infoColumn1")}</span>
                <PrintFieldEditorList
                  column="col1"
                  items={infoColumns.col1}
                  systemFieldOptions={PRINT_SYSTEM_FIELD_OPTIONS}
                  onAddSystemField={handleAddSystemField}
                  onAddCustomField={handleAddCustomField}
                  onEditSystemField={handleEditSystemField}
                  onEditCustomField={handleEditCustomField}
                  onRemove={handleRemoveField}
                  onMove={handleMoveField}
                />
              </div>
              <div className="flex flex-col gap-2">
                <span className="text-label font-medium text-foreground">{t("infoColumn2")}</span>
                <PrintFieldEditorList
                  column="col2"
                  items={infoColumns.col2}
                  systemFieldOptions={PRINT_SYSTEM_FIELD_OPTIONS}
                  onAddSystemField={handleAddSystemField}
                  onAddCustomField={handleAddCustomField}
                  onEditSystemField={handleEditSystemField}
                  onEditCustomField={handleEditCustomField}
                  onRemove={handleRemoveField}
                  onMove={handleMoveField}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("totalsRowsTitle")}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <p className="text-body-sm text-muted-foreground">{t("totalsRowsHint")}</p>
            <PrintTotalsRowList
              rows={totalsRows}
              onToggle={handleToggleTotalsRow}
              onMove={handleMoveTotalsRow}
              onUpdateLabel={handleUpdateTotalsRowLabel}
            />
          </CardContent>
        </Card>

        <Button type="submit" variant="accent" className="w-fit">
          {t("save")}
        </Button>
      </div>

      <div className="lg:sticky lg:top-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0">
            <CardTitle>{t("previewTitle")}</CardTitle>
            <Tabs value={previewSize} onValueChange={(v) => setPreviewSize(v as "A4" | "A5" | "80mm")}>
              <TabsList aria-label={t("previewSizeLabel")}>
                <TabsTrigger value="A4">A4</TabsTrigger>
                <TabsTrigger value="A5">A5</TabsTrigger>
                <TabsTrigger value="80mm">80mm</TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>
          <CardContent>
            <PrintTemplatePreview template={currentTemplate} size={previewSize} />
          </CardContent>
        </Card>
      </div>
    </form>
  );
}
