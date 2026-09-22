import { Prisma } from "@prisma/client";
import type { DecimalInput } from "@/types";

export const decimal = (value: DecimalInput) => new Prisma.Decimal(value);

export function roundMoney(value: DecimalInput): Prisma.Decimal {
  return decimal(value).toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);
}

export function lineAmount(
  quantity: DecimalInput,
  unitPrice: DecimalInput,
): Prisma.Decimal {
  return roundMoney(decimal(quantity).mul(decimal(unitPrice)));
}

export function paymentStatus(
  total: Prisma.Decimal,
  paid: Prisma.Decimal,
): "PAID" | "PARTIAL" | "UNPAID" {
  if (paid.eq(total)) return "PAID";
  return paid.isZero() ? "UNPAID" : "PARTIAL";
}
