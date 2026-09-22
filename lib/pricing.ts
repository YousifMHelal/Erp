import type { Prisma } from "@prisma/client";
import { decimal } from "@/lib/money";
import type { DecimalInput, SuggestedPrice } from "@/types";

export function chooseSuggestedPrice(
  customerPrice: DecimalInput | null,
  recentPrice: DecimalInput | null,
  cataloguePricePerSub: DecimalInput,
): SuggestedPrice {
  if (customerPrice !== null)
    return { pricePerSub: decimal(customerPrice), source: "customer" };
  if (recentPrice !== null)
    return { pricePerSub: decimal(recentPrice), source: "recent" };
  return { pricePerSub: decimal(cataloguePricePerSub), source: "catalogue" };
}

export async function suggestSellPrice(
  tx: Prisma.TransactionClient,
  productId: string,
  customerId?: string,
): Promise<SuggestedPrice> {
  const product = await tx.product.findUniqueOrThrow({
    where: { id: productId },
  });
  const saleFilter = {
    productId,
    // Superseded lines from an edited invoice keep their old price; only the
    // current lines of a live invoice should inform a suggestion.
    isCurrent: true,
    invoice: { type: "SALE" as const, status: "CONFIRMED" as const },
  };
  const customerLine = customerId
    ? await tx.invoiceLine.findFirst({
        where: {
          ...saleFilter,
          invoice: { ...saleFilter.invoice, customerId },
        },
        orderBy: { invoice: { issuedAt: "desc" } },
      })
    : null;
  const recentLine = customerLine
    ? null
    : await tx.invoiceLine.findFirst({
        where: saleFilter,
        orderBy: { invoice: { issuedAt: "desc" } },
      });
  return chooseSuggestedPrice(
    customerLine?.unitPrice.div(
      customerLine.unitType === "BASE" ? customerLine.unitsPerBaseSnapshot : 1,
    ) ?? null,
    recentLine?.unitPrice.div(
      recentLine.unitType === "BASE" ? recentLine.unitsPerBaseSnapshot : 1,
    ) ?? null,
    product.sellPricePerBase.div(product.unitsPerBase),
  );
}
