import { Prisma } from "@prisma/client";
import { decimal } from "@/lib/money";
import type { DecimalInput } from "@/types";

export function stockAfterMovement(
  stockQty: DecimalInput,
  signedChange: DecimalInput,
): Prisma.Decimal {
  const next = decimal(stockQty).plus(signedChange);
  if (next.lt(0)) throw new RangeError("INSUFFICIENT_STOCK");
  return next;
}

export function canFulfil(
  stockQty: DecimalInput,
  requestedQty: DecimalInput,
): boolean {
  const requested = decimal(requestedQty);
  return requested.gt(0) && decimal(stockQty).gte(requested);
}

export function stockStatus(
  stockQty: DecimalInput,
  minStockQty: DecimalInput,
): "OUT_OF_STOCK" | "LOW_STOCK" | "IN_STOCK" {
  const stock = decimal(stockQty);
  if (stock.lte(0)) return "OUT_OF_STOCK";
  return stock.lte(minStockQty) ? "LOW_STOCK" : "IN_STOCK";
}
