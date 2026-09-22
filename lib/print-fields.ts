import { formatDate } from "@/lib/format";
import type {
  PrintFieldItem,
  PrintInfoColumnKey,
  PrintInfoColumns,
  PrintInvoiceData,
  PrintSystemFieldKey,
  PrintSystemFieldOption,
  PrintTotalsRowConfig,
} from "@/types";

/** The totals-block rows, in their default order. `label` starts empty — the labelKey translation is used until the user customizes it. */
export const DEFAULT_TOTALS_ROWS: PrintTotalsRowConfig[] = [
  { key: "total", labelKey: "totalsRows.total", label: "", visible: true },
  { key: "discount", labelKey: "totalsRows.discount", label: "", visible: true },
  { key: "previousBalance", labelKey: "totalsRows.previousBalance", label: "", visible: true },
  { key: "paid", labelKey: "totalsRows.paid", label: "", visible: true },
  { key: "remaining", labelKey: "totalsRows.remaining", label: "", visible: true },
];

/** Every field the system can resolve to a real value at print time, grouped for the "add field" picker. */
export const PRINT_SYSTEM_FIELD_OPTIONS: PrintSystemFieldOption[] = [
  { key: "invoiceNumber", labelKey: "settings.printTemplate.systemFields.invoiceNumber" },
  { key: "invoiceDate", labelKey: "settings.printTemplate.systemFields.invoiceDate" },
  { key: "invoiceTime", labelKey: "settings.printTemplate.systemFields.invoiceTime" },
  { key: "cashierName", labelKey: "settings.printTemplate.systemFields.cashierName" },
  { key: "customerName", labelKey: "settings.printTemplate.systemFields.customerName" },
  { key: "customerCompanyName", labelKey: "settings.printTemplate.systemFields.customerCompanyName" },
  { key: "customerPhone", labelKey: "settings.printTemplate.systemFields.customerPhone" },
  { key: "customerAddress", labelKey: "settings.printTemplate.systemFields.customerAddress" },
  { key: "shopName", labelKey: "settings.printTemplate.systemFields.shopName" },
  { key: "shopPhone", labelKey: "settings.printTemplate.systemFields.shopPhone" },
  { key: "shopPhone2", labelKey: "settings.printTemplate.systemFields.shopPhone2" },
  { key: "shopAddress", labelKey: "settings.printTemplate.systemFields.shopAddress" },
];

/** Resolves a system field to its real printed value for this invoice. Returns undefined when the field has no value (row is skipped). */
export function resolveSystemFieldValue(fieldKey: PrintSystemFieldKey, data: PrintInvoiceData): string | undefined {
  switch (fieldKey) {
    case "invoiceNumber":
      return String(data.number);
    case "invoiceDate":
      return formatDate(data.issuedAt);
    case "invoiceTime":
      return data.issuedTime;
    case "cashierName":
      return data.cashierName;
    case "customerName":
      return data.partyName;
    case "customerCompanyName":
      return data.partyCompanyName;
    case "customerPhone":
      return data.partyPhone;
    case "customerAddress":
      return data.partyAddress;
    case "shopName":
      return data.shop.name;
    case "shopPhone":
      return data.shop.phone;
    case "shopPhone2":
      return data.shop.phone2;
    case "shopAddress":
      return data.shop.address;
    default:
      return undefined;
  }
}

let idCounter = 0;
function nextId(): string {
  idCounter += 1;
  return `default-field-${idCounter}`;
}

function systemField(fieldKey: PrintSystemFieldKey, label: string): PrintFieldItem {
  return { id: nextId(), label, source: { kind: "system", fieldKey } };
}

/** The starting arrangement every new template ships with — editable/removable like any other field. */
export function createDefaultInfoColumns(labels: {
  invoiceNumber: string;
  invoiceDate: string;
  customerName: string;
  customerCompanyName: string;
  customerPhone: string;
  customerAddress: string;
  shopAddress: string;
}): PrintInfoColumns {
  return {
    col1: [
      systemField("invoiceNumber", labels.invoiceNumber),
      systemField("invoiceDate", labels.invoiceDate),
    ],
    col2: [
      systemField("customerName", labels.customerName),
      systemField("customerCompanyName", labels.customerCompanyName),
      systemField("customerPhone", labels.customerPhone),
      systemField("customerAddress", labels.customerAddress),
      systemField("shopAddress", labels.shopAddress),
    ],
  };
}

export function createFieldId(): string {
  return `field-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function moveFieldItem(
  items: PrintFieldItem[],
  id: string,
  direction: "up" | "down",
): PrintFieldItem[] {
  const index = items.findIndex((item) => item.id === id);
  const swapWith = direction === "up" ? index - 1 : index + 1;
  if (index < 0 || swapWith < 0 || swapWith >= items.length) return items;
  const current = items[index];
  const target = items[swapWith];
  if (!current || !target) return items;
  const next = [...items];
  next[index] = target;
  next[swapWith] = current;
  return next;
}

export function updateInfoColumn(
  columns: PrintInfoColumns,
  column: PrintInfoColumnKey,
  updater: (items: PrintFieldItem[]) => PrintFieldItem[],
): PrintInfoColumns {
  return { ...columns, [column]: updater(columns[column]) };
}

export function moveTotalsRow(
  rows: PrintTotalsRowConfig[],
  key: PrintTotalsRowConfig["key"],
  direction: "up" | "down",
): PrintTotalsRowConfig[] {
  const index = rows.findIndex((row) => row.key === key);
  const swapWith = direction === "up" ? index - 1 : index + 1;
  if (index < 0 || swapWith < 0 || swapWith >= rows.length) return rows;
  const current = rows[index];
  const target = rows[swapWith];
  if (!current || !target) return rows;
  const next = [...rows];
  next[index] = target;
  next[swapWith] = current;
  return next;
}
