import { Prisma } from "@prisma/client";
import { lineAmount, decimal } from "@/lib/money";
import { syncNotifications } from "@/lib/notifications";
import type {
  OriginalInvoiceForReturn,
  PreparedReturn,
  ReturnErrorCode,
  ReturnLineSnapshot,
} from "@/types";

export class ReturnDomainError extends Error {
  constructor(public readonly code: ReturnErrorCode) {
    super(code);
  }
}

type PrepareReturnInput = {
  originalInvoiceId: string;
  cashboxId: string;
  lines: { productId: string; qtyInSub: string }[];
};

/**
 * Validates and prices a return against its original invoice. Quantities are capped by
 * `qtyInvoiced - qtyAlreadyReturned` per product across all prior confirmed returns of
 * that invoice — never against the invoice's current (possibly already-returned) lines
 * alone, which would let two partial returns together exceed what was actually sold/bought.
 */
export async function prepareReturn(
  tx: Prisma.TransactionClient,
  input: PrepareReturnInput,
  originalType: "SALE" | "PURCHASE",
): Promise<{ prepared: PreparedReturn; original: OriginalInvoiceForReturn }> {
  const original = await tx.invoice.findFirst({
    where: { id: input.originalInvoiceId, type: originalType },
    include: {
      lines: { where: { isCurrent: true } },
      returns: {
        where: { status: "CONFIRMED" },
        include: { lines: { where: { isCurrent: true } } },
      },
    },
  });
  if (!original) throw new ReturnDomainError("notFound");
  if (original.status === "CANCELLED") throw new ReturnDomainError("originalCancelled");

  const alreadyReturnedByProduct = new Map<string, Prisma.Decimal>();
  for (const ret of original.returns) {
    for (const line of ret.lines) {
      const running = alreadyReturnedByProduct.get(line.productId) ?? decimal(0);
      alreadyReturnedByProduct.set(line.productId, running.plus(line.qtyInSub));
    }
  }

  const originalLineByProduct = new Map(
    original.lines.map((line) => [line.productId, line]),
  );

  const products = await tx.product.findMany({
    where: { id: { in: input.lines.map((line) => line.productId) } },
  });
  const productById = new Map(products.map((product) => [product.id, product]));

  const lines: ReturnLineSnapshot[] = input.lines.map((line, sortOrder) => {
    const originalLine = originalLineByProduct.get(line.productId);
    if (!originalLine) throw new ReturnDomainError("exceedsOriginal");
    const product = productById.get(line.productId);
    if (!product) throw new ReturnDomainError("inactiveProduct");

    const qtyInSub = decimal(line.qtyInSub);
    const alreadyReturned = alreadyReturnedByProduct.get(line.productId) ?? decimal(0);
    const maxReturnable = originalLine.qtyInSub.minus(alreadyReturned);
    if (qtyInSub.lte(0) || qtyInSub.gt(maxReturnable))
      throw new ReturnDomainError("exceedsOriginal");

    const unitPrice = originalLine.unitPrice;
    const qtyInUnit = originalLine.unitType === "BASE"
      ? qtyInSub.div(originalLine.unitsPerBaseSnapshot)
      : qtyInSub;

    return {
      productId: product.id,
      productName: originalLine.productName,
      unitName: originalLine.unitName,
      unitType: originalLine.unitType,
      unitsPerBaseSnapshot: originalLine.unitsPerBaseSnapshot,
      qtyInUnit,
      qtyInSub,
      unitPrice,
      lineTotal: lineAmount(qtyInUnit, unitPrice),
      costPerSubAtSale: originalLine.costPerSubAtSale,
      sortOrder,
    };
  });

  const total = lines.reduce((sum, line) => sum.plus(line.lineTotal), decimal(0));

  const cashbox = await tx.cashbox.findUnique({ where: { id: input.cashboxId } });
  if (!cashbox?.isActive) throw new ReturnDomainError("cashbox");

  return {
    prepared: { lines, subtotal: total, discountAmount: decimal(0), total },
    original,
  };
}

async function moveStock(
  tx: Prisma.TransactionClient,
  input: {
    productId: string;
    quantity: Prisma.Decimal;
    cost: Prisma.Decimal;
    invoiceId: string;
    movementType: "SALE_RETURN" | "PURCHASE_RETURN";
    userId: string;
    note?: string;
  },
) {
  if (input.quantity.lt(0)) {
    const updated = await tx.product.updateMany({
      where: { id: input.productId, stockQty: { gte: input.quantity.negated() } },
      data: { stockQty: { decrement: input.quantity.negated() } },
    });
    if (updated.count !== 1) throw new ReturnDomainError("exceedsOriginal");
  } else {
    await tx.product.update({
      where: { id: input.productId },
      data: { stockQty: { increment: input.quantity } },
    });
  }
  const product = await tx.product.findUniqueOrThrow({
    where: { id: input.productId },
    select: { stockQty: true },
  });
  await tx.stockMovement.create({
    data: {
      productId: input.productId,
      type: input.movementType,
      qtyInSub: input.quantity,
      balanceAfter: product.stockQty,
      unitCostPerSub: input.cost,
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
    movementType: "SALE_RETURN_REFUND" | "PURCHASE_RETURN_REFUND";
    customerId?: string | null;
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
      type: input.movementType,
      amount: input.amount,
      balanceAfter: cashbox.balance,
      refType: "INVOICE",
      refId: input.invoiceId,
      invoiceId: input.invoiceId,
      customerId: input.customerId,
      supplierId: input.supplierId,
      createdById: input.userId,
      note: input.note,
    },
  });
}

async function movePartyBalance(
  tx: Prisma.TransactionClient,
  input: {
    partyType: "CUSTOMER" | "SUPPLIER";
    customerId?: string | null;
    supplierId?: string | null;
    amount: Prisma.Decimal;
    invoiceId: string;
    userId: string;
    note?: string;
  },
) {
  if (input.amount.isZero()) return;
  if (input.partyType === "CUSTOMER") {
    if (!input.customerId) return;
    const customer = await tx.customer.update({
      where: { id: input.customerId },
      data: { balance: { increment: input.amount } },
    });
    await tx.partyTransaction.create({
      data: {
        partyType: "CUSTOMER",
        customerId: input.customerId,
        type: "RETURN",
        debit: input.amount.gt(0) ? input.amount : decimal(0),
        credit: input.amount.lt(0) ? input.amount.negated() : decimal(0),
        balanceAfter: customer.balance,
        refType: "INVOICE",
        refId: input.invoiceId,
        invoiceId: input.invoiceId,
        createdById: input.userId,
        note: input.note,
      },
    });
    await syncNotifications(tx, { customerIds: [input.customerId] });
  } else {
    if (!input.supplierId) return;
    const supplier = await tx.supplier.update({
      where: { id: input.supplierId },
      data: { balance: { increment: input.amount } },
    });
    await tx.partyTransaction.create({
      data: {
        partyType: "SUPPLIER",
        supplierId: input.supplierId,
        type: "RETURN",
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
}

/**
 * Posts a confirmed return. `settleFromCashbox` chooses the refund path: true pays/collects
 * cash immediately (cashbox moves), false instead adjusts the party's balance by the full
 * return total. The two are mutually exclusive per PRD §15 — a return settles one way or the
 * other, never split, which keeps the ledger simple and matches the static form's toggle.
 */
export async function postReturn(
  tx: Prisma.TransactionClient,
  input: {
    invoiceId: string;
    cashboxId: string;
    documentType: "SALE_RETURN" | "PURCHASE_RETURN";
    customerId?: string | null;
    supplierId?: string | null;
    settleFromCashbox: boolean;
    prepared: PreparedReturn;
    userId: string;
  },
) {
  const isSaleReturn = input.documentType === "SALE_RETURN";
  const stockSign = isSaleReturn ? 1 : -1;
  for (const line of input.prepared.lines) {
    await moveStock(tx, {
      productId: line.productId,
      quantity: line.qtyInSub.mul(stockSign),
      cost: line.costPerSubAtSale,
      invoiceId: input.invoiceId,
      movementType: input.documentType,
      userId: input.userId,
    });
  }

  // Sale return refunds cash out (or reduces what the customer owes); purchase return
  // receives cash back (or reduces what we owe the supplier) — opposite cash direction.
  const cashSign = isSaleReturn ? -1 : 1;
  if (input.settleFromCashbox) {
    await moveCash(tx, {
      cashboxId: input.cashboxId,
      amount: input.prepared.total.mul(cashSign),
      invoiceId: input.invoiceId,
      movementType: isSaleReturn ? "SALE_RETURN_REFUND" : "PURCHASE_RETURN_REFUND",
      customerId: input.customerId,
      supplierId: input.supplierId,
      userId: input.userId,
    });
  } else {
    await movePartyBalance(tx, {
      partyType: isSaleReturn ? "CUSTOMER" : "SUPPLIER",
      customerId: input.customerId,
      supplierId: input.supplierId,
      amount: input.prepared.total.negated(),
      invoiceId: input.invoiceId,
      userId: input.userId,
    });
  }

  await syncNotifications(tx, { productIds: input.prepared.lines.map((line) => line.productId) });
}
