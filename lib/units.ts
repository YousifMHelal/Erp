import type { UnitType } from "@/types";

/**
 * Converts a per-unit price when switching a line between base and sub units,
 * keeping the underlying per-sub-unit value constant.
 */
export function convertUnitPrice(currentPrice: number, currentUnit: UnitType, nextUnit: UnitType, unitsPerBase: number): number {
  if (currentUnit === nextUnit) return currentPrice;
  const pricePerSub = currentUnit === "BASE" ? currentPrice / unitsPerBase : currentPrice;
  return nextUnit === "BASE" ? pricePerSub * unitsPerBase : pricePerSub;
}
