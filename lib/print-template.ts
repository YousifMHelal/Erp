import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { DEFAULT_TOTALS_ROWS, createDefaultInfoColumns } from "@/lib/print-fields";
import { printTemplateLayoutSchema } from "@/lib/validations";
import type { PrintTemplateLayout } from "@/types";

export const PRINT_TEMPLATE_SETTING_KEY = "print.template";

/** The saved print layout, or null when none has been saved (or the stored JSON no longer validates). */
export async function loadPrintTemplateLayout(): Promise<PrintTemplateLayout | null> {
  const setting = await prisma.setting.findUnique({ where: { key: PRINT_TEMPLATE_SETTING_KEY } });
  if (!setting) return null;
  const parsed = printTemplateLayoutSchema.safeParse(setting.value);
  return parsed.success ? parsed.data : null;
}

/** The layout a shop starts with — shared by the template editor and the print page so both render identically before any save. */
export async function buildDefaultPrintLayout(): Promise<PrintTemplateLayout> {
  const [tFields, tPrint] = await Promise.all([
    getTranslations("settings.printTemplate.systemFields"),
    getTranslations("print"),
  ]);
  return {
    templateName: "",
    lineColumns: [
      { key: "unitName", labelKey: "columnUnitName", visible: true },
      { key: "sku", labelKey: "columnSku", visible: false },
      { key: "discount", labelKey: "columnDiscount", visible: false },
    ],
    infoColumns: createDefaultInfoColumns({
      invoiceNumber: tFields("invoiceNumber"),
      invoiceDate: tFields("invoiceDate"),
      customerName: tFields("customerName"),
      customerCompanyName: tFields("customerCompanyName"),
      customerPhone: tFields("customerPhone"),
      customerAddress: tFields("customerAddress"),
      shopAddress: tPrint("shopAddress"),
    }),
    totalsRows: DEFAULT_TOTALS_ROWS,
  };
}

/** Saved layout if there is one, otherwise the default. */
export async function resolvePrintTemplateLayout(): Promise<PrintTemplateLayout> {
  return (await loadPrintTemplateLayout()) ?? (await buildDefaultPrintLayout());
}
