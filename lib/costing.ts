import { Prisma } from "@prisma/client";
import { decimal } from "@/lib/money";
import type { DecimalInput } from "@/types";

export function weightedAverageCost(
  oldQuantity: DecimalInput,
  oldCostPerSub: DecimalInput,
  incomingQuantity: DecimalInput,
  incomingCostPerSub: DecimalInput,
): Prisma.Decimal {
  const oldQty = decimal(oldQuantity);
  const addedQty = decimal(incomingQuantity);
  if (oldQty.lt(0) || addedQty.lte(0))
    throw new RangeError("Invalid weighted average quantities");
  return oldQty
    .mul(oldCostPerSub)
    .plus(addedQty.mul(incomingCostPerSub))
    .div(oldQty.plus(addedQty))
    .toDecimalPlaces(4, Prisma.Decimal.ROUND_HALF_UP);
}
