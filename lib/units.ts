import type { UnitType } from "@/types";
import { Prisma } from "@prisma/client";
import type { DecimalInput } from "@/types";

export function toSubUnits(
  quantity: DecimalInput,
  unit: UnitType,
  unitsPerBase: DecimalInput,
): Prisma.Decimal {
  const ratio = new Prisma.Decimal(unitsPerBase);
  if (ratio.lte(0)) throw new RangeError("unitsPerBase must be positive");
  return new Prisma.Decimal(quantity).mul(unit === "BASE" ? ratio : 1);
}

export function toBaseUnits(
  quantityInSub: DecimalInput,
  unitsPerBase: DecimalInput,
): Prisma.Decimal {
  const ratio = new Prisma.Decimal(unitsPerBase);
  if (ratio.lte(0)) throw new RangeError("unitsPerBase must be positive");
  return new Prisma.Decimal(quantityInSub).div(ratio);
}

/**
 * Converts a per-unit price when switching a line between base and sub units,
 * keeping the underlying per-sub-unit value constant.
 */
export function convertUnitPrice(
  currentPrice: number,
  currentUnit: UnitType,
  nextUnit: UnitType,
  unitsPerBase: number,
): number {
  if (currentUnit === nextUnit) return currentPrice;
  const pricePerSub =
    currentUnit === "BASE" ? currentPrice / unitsPerBase : currentPrice;
  return nextUnit === "BASE" ? pricePerSub * unitsPerBase : pricePerSub;
}
