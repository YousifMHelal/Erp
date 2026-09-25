import { format as formatDateFns } from "date-fns";
import { arEG } from "date-fns/locale";
import { Prisma } from "@prisma/client";

function groupDigits(value: string): string {
  return value.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

export function formatMoney(value: Prisma.Decimal | string): string {
  return `${formatAmount(value)} ج.م`;
}

/** Money without the currency suffix — used on printed documents. */
export function formatAmount(value: Prisma.Decimal | string): string {
  const fixed = new Prisma.Decimal(value).toFixed(2);
  const negative = fixed.startsWith("-");
  const [integer = "0", fraction = "00"] = (negative ? fixed.slice(1) : fixed).split(".");
  return `${negative ? "−" : ""}${groupDigits(integer)}.${fraction}`;
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

export function formatTime(value: Date | string): string {
  return formatDateFns(new Date(value), "h:mm a", { locale: arEG });
}

const ONES = ["", "واحد", "اثنان", "ثلاثة", "أربعة", "خمسة", "ستة", "سبعة", "ثمانية", "تسعة"];
const TEENS = [
  "عشرة",
  "أحد عشر",
  "اثنا عشر",
  "ثلاثة عشر",
  "أربعة عشر",
  "خمسة عشر",
  "ستة عشر",
  "سبعة عشر",
  "ثمانية عشر",
  "تسعة عشر",
];
const TENS = ["", "", "عشرون", "ثلاثون", "أربعون", "خمسون", "ستون", "سبعون", "ثمانون", "تسعون"];
const HUNDREDS = [
  "",
  "مائة",
  "مائتان",
  "ثلاثمائة",
  "أربعمائة",
  "خمسمائة",
  "ستمائة",
  "سبعمائة",
  "ثمانمائة",
  "تسعمائة",
];

/** Converts a 0-999 integer to Arabic words, joined with "و" (and). */
function threeDigitsToWords(n: number): string {
  const parts: string[] = [];
  const hundreds = Math.floor(n / 100);
  const remainder = n % 100;
  if (hundreds > 0) parts.push(HUNDREDS[hundreds]!);
  if (remainder >= 10 && remainder < 20) {
    parts.push(TEENS[remainder - 10]!);
  } else {
    const tens = Math.floor(remainder / 10);
    const ones = remainder % 10;
    if (ones > 0) parts.push(ONES[ones]!);
    if (tens >= 2) parts.push(TENS[tens]!);
  }
  return parts.join(" و");
}

const SCALES = [
  { value: 1_000_000_000, singular: "مليار", dual: "ملياران", plural: "مليارات" },
  { value: 1_000_000, singular: "مليون", dual: "مليونان", plural: "ملايين" },
  { value: 1_000, singular: "ألف", dual: "ألفان", plural: "آلاف" },
];

function scaleGroupToWords(count: number, scale: (typeof SCALES)[number]): string {
  if (count === 1) return scale.singular;
  if (count === 2) return scale.dual;
  const words = threeDigitsToWords(count);
  return count <= 10 ? `${words} ${scale.plural}` : `${words} ${scale.singular}`;
}

/**
 * Converts a non-negative integer amount into Arabic words for the invoice's
 * "المطلوب بالحروف" line. Handles up to billions; falls back to "صفر" for zero.
 */
export function numberToArabicWords(value: number): string {
  const n = Math.floor(Math.abs(value));
  if (n === 0) return "صفر";

  const parts: string[] = [];
  let remainder = n;
  for (const scale of SCALES) {
    const count = Math.floor(remainder / scale.value);
    if (count > 0) {
      parts.push(scaleGroupToWords(count, scale));
      remainder %= scale.value;
    }
  }
  if (remainder > 0) parts.push(threeDigitsToWords(remainder));

  return parts.join(" و");
}

/** "المطلوب: سبعة مائة وخمسين ألف... جنيه" style line for a money amount. */
export function formatMoneyInWords(value: Prisma.Decimal | string): string {
  const decimal = new Prisma.Decimal(value);
  const whole = decimal.trunc().toNumber();
  const fraction = decimal.minus(whole).times(100).round().toNumber();
  const wholeWords = `${numberToArabicWords(whole)} جنيه`;
  if (fraction === 0) return wholeWords;
  return `${wholeWords} و${numberToArabicWords(fraction)} قرش`;
}

/**
 * Formats a Date as the `yyyy-MM-dd` string the sales filters and date-only Zod
 * schemas expect. Uses the local calendar date so a picker selection never shifts
 * a day across the UTC boundary.
 */
export function toDateInputValue(date: Date | undefined): string | undefined {
  if (!date || Number.isNaN(date.getTime())) return undefined;
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

/**
 * The shop's fixed UTC offset in hours. Egypt abolished DST in 2016 and stays at
 * UTC+2 year-round, so a single constant (rather than a stored/detected timezone)
 * is correct for this single-shop app.
 */
export const SHOP_UTC_OFFSET_HOURS = 2;

/** Shop-local clock time ("3:05 م"), independent of the server's timezone (Vercel runs in UTC). */
export function formatShopTime(value: Date | string): string {
  const shifted = new Date(new Date(value).getTime() + SHOP_UTC_OFFSET_HOURS * 3_600_000);
  const hours = shifted.getUTCHours();
  const minutes = String(shifted.getUTCMinutes()).padStart(2, "0");
  const twelveHour = hours % 12 === 0 ? 12 : hours % 12;
  return `${twelveHour}:${minutes} ${hours < 12 ? "ص" : "م"}`;
}

/** Converts a `yyyy-MM-dd` date-only string into the UTC instant of that date's local midnight. */
export function shopDayStart(dateOnly: string): Date {
  return new Date(`${dateOnly}T00:00:00Z`.replace("Z", "") + `+${String(SHOP_UTC_OFFSET_HOURS).padStart(2, "0")}:00`);
}

/** The UTC instant just past the end of a `yyyy-MM-dd` local day — an exclusive upper bound for a `lt` filter. */
export function shopDayEnd(dateOnly: string): Date {
  return new Date(shopDayStart(dateOnly).getTime() + 86_400_000);
}
