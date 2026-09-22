import { Prisma } from "@prisma/client";
import { lineAmount, paymentStatus, decimal } from "@/lib/money";
import { toSubUnits } from "@/lib/units";
import { weightedAverageCost } from "@/lib/costing";
import { syncNotifications } from "@/lib/notifications";
import type {
  PreparedPurchase,
  PurchaseErrorCode,
  PurchaseInput,
  PurchaseLineSnapshot,
  PurchaseWithLines,
} from "@/types";

export class PurchaseDomainError extends Error {
  constructor(public readonly code: PurchaseErrorCode) {
    super(code);
  }
}

export async function preparePurchase(
  tx: Prisma.TransactionClient,
  input: PurchaseInput,
): Promise<PreparedPurchase> {
  const products = await tx.product.findMany({
    where: { id: { in: input.lines.map((line) => line.productId) } },
  });
  const byId = new Map(products.map((product) => [product.id, product]));
  const lines: PurchaseLineSnapshot[] = input.lines.map((line, sortOrder) => {
    const product = byId.get(line.productId);
    if (!product?.isActive) throw new PurchaseDomainError("inactiveProduct");
    const qtyInUnit = decimal(line.qtyInUnit);
    const qtyInSub = toSubUnits(qtyInUnit, line.unitType, product.unitsPerBase);
    if (qtyInSub.decimalPlaces() > 4)
      throw new PurchaseDomainError("invalidQuantity");
    const unitPrice = decimal(line.unitPrice);
    const costPerSub =
      line.unitType === "BASE" ? unitPrice.div(product.unitsPerBase) : unitPrice;
    return {
      productId: product.id,
      productName: product.name,
      unitName:
        line.unitType === "BASE" ? product.baseUnitName : product.subUnitName,
      unitType: line.unitType,
      unitsPerBaseSnapshot: product.unitsPerBase,
      qtyInUnit,
      qtyInSub,
      unitPrice,
      lineTotal: lineAmount(qtyInUnit, unitPrice),
      costPerSubAtSale: costPerSub.toDecimalPlaces(4, Prisma.Decimal.ROUND_HALF_UP),
      sortOrder,
    };
  });

  const subtotal = lines.reduce(
    (sum, line) => sum.plus(line.lineTotal),
    decimal(0),
  );
  const discountAmount = decimal(input.discountAmount);
  if (discountAmount.gt(subtotal)) throw new PurchaseDomainError("discount");
  const total = subtotal.minus(discountAmount);
  const paidAmount = decimal(input.paidAmount);
  if (paidAmount.gt(total)) throw new PurchaseDomainError("paid");
  const remainingAmount = total.minus(paidAmount);
  if (remainingAmount.gt(0) && !input.supplierId)
    throw new PurchaseDomainError("supplier");

  const cashbox = await tx.cashbox.findUnique({
    where: { id: input.cashboxId },
  });
  if (!cashbox?.isActive) throw new PurchaseDomainError("cashbox");
  if (input.supplierId) {
    const supplier = await tx.supplier.findUnique({
      where: { id: input.supplierId },
    });
    if (!supplier?.isActive) throw new PurchaseDomainError("supplier");
  }
  return {
    lines,
    subtotal,
    discountAmount,
    total,
    paidAmount,
    remainingAmount,
    paymentStatus: paymentStatus(total, paidAmount),
  };
}

/**
 * Moves stock for one purchase line. On a positive (incoming) quantity the
 * product's `avgCostPerSub` is recomputed as a weighted average against the
 * line's own cost — never done on the reversing (negative) leg, since a
 * cancellation must undo the quantity without re-deriving a cost from a
 * negative addition.
 */
async function moveStock(
  tx: Prisma.TransactionClient,
  input: {
    productId: string;
    quantity: Prisma.Decimal;
    costPerSub: Prisma.Decimal;
    invoiceId: string;
    userId: string;
    recomputeCost: boolean;
    note?: string;
  },
) {
  const before = await tx.product.findUniqueOrThrow({
    where: { id: input.productId },
    select: { stockQty: true, avgCostPerSub: true },
  });

  if (input.quantity.lt(0)) {
    const updated = await tx.product.updateMany({
      where: {
        id: input.productId,
        stockQty: { gte: input.quantity.negated() },
      },
      data: { stockQty: { decrement: input.quantity.negated() } },
    });
    if (updated.count !== 1) throw new PurchaseDomainError("stock");
  } else {
    const nextAvgCost = input.recomputeCost
      ? weightedAverageCost(
          before.stockQty,
          before.avgCostPerSub,
          input.quantity,
          input.costPerSub,
        )
      : before.avgCostPerSub;
    await tx.product.update({
      where: { id: input.productId },
      data: {
        stockQty: { increment: input.quantity },
        avgCostPerSub: nextAvgCost,
      },
    });
  }

  const product = await tx.product.findUniqueOrThrow({
    where: { id: input.productId },
    select: { stockQty: true },
  });
  await tx.stockMovement.create({
    data: {
      productId: input.productId,
      type: "PURCHASE",
      qtyInSub: input.quantity,
      balanceAfter: product.stockQty,
      unitCostPerSub: input.costPerSub,
      refType: "INVOICE",
      refId: input.invoiceId,
      invoiceId: input.invoiceId,
      createdById: input.userId,
      note: input.note,
    },
  });
}

async function moveCash(
  tx: Prisma.TransactionClient,
  input: {
    cashboxId: string;
    amount: Prisma.Decimal;
    invoiceId: string;
    supplierId?: string | null;
    userId: string;
    note?: string;
  },
) {
  if (input.amount.isZero()) return;
  const cashbox = await tx.cashbox.update({
    where: { id: input.cashboxId },
    data: { balance: { increment: input.amount } },
  });
  await tx.cashMovement.create({
    data: {
      cashboxId: input.cashboxId,
      type: "PURCHASE_PAYMENT",
      amount: input.amount,
      balanceAfter: cashbox.balance,
      refType: "INVOICE",
      refId: input.invoiceId,
      invoiceId: input.invoiceId,
      supplierId: input.supplierId,
      createdById: input.userId,
      note: input.note,
    },
  });
}

async function moveSupplierBalance(
  tx: Prisma.TransactionClient,
  input: {
    supplierId?: string | null;
    amount: Prisma.Decimal;
    invoiceId: string;
    userId: string;
    note?: string;
  },
) {
  if (input.amount.isZero()) return;
  if (!input.supplierId) throw new PurchaseDomainError("supplier");
  const supplier = await tx.supplier.update({
    where: { id: input.supplierId },
    data: { balance: { increment: input.amount } },
  });
  await tx.partyTransaction.create({
    data: {
      partyType: "SUPPLIER",
      supplierId: input.supplierId,
      type: "INVOICE",
      debit: input.amount.gt(0) ? input.amount : decimal(0),
      credit: input.amount.lt(0) ? input.amount.negated() : decimal(0),
      balanceAfter: supplier.balance,
      refType: "INVOICE",
      refId: input.invoiceId,
      invoiceId: input.invoiceId,
      createdById: input.userId,
      note: input.note,
    },
  });
  await syncNotifications(tx, { supplierIds: [input.supplierId] });
}

export async function postPurchase(
  tx: Prisma.TransactionClient,
  input: {
    invoiceId: string;
    cashboxId: string;
    supplierId?: string | null;
    purchase: PreparedPurchase;
    userId: string;
  },
) {
  for (const line of input.purchase.lines) {
    await moveStock(tx, {
      productId: line.productId,
      quantity: line.qtyInSub,
      costPerSub: line.costPerSubAtSale,
      invoiceId: input.invoiceId,
      userId: input.userId,
      recomputeCost: true,
    });
  }
  await moveCash(tx, {
    cashboxId: input.cashboxId,
    amount: input.purchase.paidAmount.negated(),
    invoiceId: input.invoiceId,
    supplierId: input.supplierId,
    userId: input.userId,
  });
  await moveSupplierBalance(tx, {
    supplierId: input.supplierId,
    amount: input.purchase.remainingAmount,
    invoiceId: input.invoiceId,
    userId: input.userId,
  });
  await syncNotifications(tx, { productIds: input.purchase.lines.map((line) => line.productId) });
}

export async function reversePurchase(
  tx: Prisma.TransactionClient,
  invoice: PurchaseWithLines,
  userId: string,
  reason: string,
) {
  for (const line of invoice.lines.filter((entry) => entry.isCurrent)) {
    await moveStock(tx, {
      productId: line.productId,
      quantity: line.qtyInSub.negated(),
      costPerSub: line.costPerSubAtSale,
      invoiceId: invoice.id,
      userId,
      recomputeCost: false,
      note: reason,
    });
  }
  await moveCash(tx, {
    cashboxId: invoice.cashboxId,
    amount: invoice.paidAmount,
    invoiceId: invoice.id,
    supplierId: invoice.supplierId,
    userId,
    note: reason,
  });
  await moveSupplierBalance(tx, {
    supplierId: invoice.supplierId,
    amount: invoice.remainingAmount.negated(),
    invoiceId: invoice.id,
    userId,
    note: reason,
  });
  await syncNotifications(tx, {
    productIds: invoice.lines.filter((entry) => entry.isCurrent).map((entry) => entry.productId),
  });
}
