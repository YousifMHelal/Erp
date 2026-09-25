import { prisma } from "@/lib/prisma";
import { resolvePrintTemplateLayout } from "@/lib/print-template";
import messages from "@/messages/ar.json";
import type { PrintSystemFieldKey, ReportPrintField, ReportPrintShop } from "@/types";

const SHOP_SETTING_KEYS = ["shop.name", "shop.phone", "shop.phone2", "shop.address"];

/**
 * Shop name, logo and the print template's shop-level info fields for a printed report.
 * Invoice/party-specific template fields (number, customer, cashier, date) don't apply to a report and are skipped.
 */
export async function loadReportPrintShop(): Promise<ReportPrintShop> {
  const [settings, template] = await Promise.all([
    prisma.setting.findMany({ where: { key: { in: SHOP_SETTING_KEYS } } }),
    resolvePrintTemplateLayout(),
  ]);
  const setting = (key: string): string | undefined => {
    const value = settings.find((entry) => entry.key === key)?.value;
    return typeof value === "string" && value ? value : undefined;
  };
  const name = setting("shop.name") ?? messages.app.name;
  const shopFields: Partial<Record<PrintSystemFieldKey, string>> = {
    shopName: name,
    shopPhone: setting("shop.phone"),
    shopPhone2: setting("shop.phone2"),
    shopAddress: setting("shop.address"),
  };
  const fields = [...template.infoColumns.col1, ...template.infoColumns.col2].flatMap((item): ReportPrintField[] => {
    const value = item.source.kind === "custom" ? item.source.value : shopFields[item.source.fieldKey];
    return value ? [{ label: item.label, value }] : [];
  });

  return { name, logoDataUrl: template.logoDataUrl, fields };
}
