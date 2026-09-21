import { format as formatDateFns } from "date-fns";
import { arEG } from "date-fns/locale";
import { Prisma } from "@prisma/client";

function groupDigits(value: string): string {
  return value.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

export function formatMoney(value: Prisma.Decimal | string): string {
  const fixed = new Prisma.Decimal(value).toFixed(2);
  const negative = fixed.startsWith("-");
  const [integer = "0", fraction = "00"] = (negative ? fixed.slice(1) : fixed).split(".");
  return `${negative ? "−" : ""}${groupDigits(integer)}.${fraction} ج.م`;
}

export function formatNumber(value: Prisma.Decimal | string | number, decimals = 3): string {
  const fixed = new Prisma.Decimal(value).toFixed(decimals);
  const negative = fixed.startsWith("-");
  const [integer = "0", fraction = ""] = (negative ? fixed.slice(1) : fixed).split(".");
  const trimmed = fraction.replace(/0+$/, "");
  return `${negative ? "−" : ""}${groupDigits(integer)}${trimmed ? `.${trimmed}` : ""}`;
}

export function formatDate(value: Date | string): string {
  return formatDateFns(new Date(value), "dd/MM/yyyy", { locale: arEG });
}
