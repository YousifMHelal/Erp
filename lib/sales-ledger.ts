import { Prisma } from "@prisma/client";
import { lineAmount, paymentStatus, decimal } from "@/lib/money";
import { toSubUnits } from "@/lib/units";
import type {
  PreparedSale,
  SaleErrorCode,
  SaleInput,
  SaleLineSnapshot,
  SaleWithLines,
} from "@/types";

export class SaleDomainError extends Error {
  constructor(public readonly code: SaleErrorCode) {
    super(code);
  }
}

export async function prepareSale(
  tx: Prisma.TransactionClient,
  input: SaleInput,
): Promise<PreparedSale> {
  const products = await tx.product.findMany({
    where: { id: { in: input.lines.map((line) => line.productId) } },
  });
  const byId = new Map(products.map((product) => [product.id, product]));
  const lines: SaleLineSnapshot[] = input.lines.map((line, sortOrder) => {
    const product = byId.get(line.productId);
    if (!product?.isActive) throw new SaleDomainError("inactiveProduct");
    const qtyInUnit = decimal(line.qtyInUnit);
    const qtyInSub = toSubUnits(qtyInUnit, line.unitType, product.unitsPerBase);
    if (qtyInSub.decimalPlaces() > 4)
      throw new SaleDomainError("invalidQuantity");
    const unitPrice = decimal(line.unitPrice);
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
      costPerSubAtSale: product.avgCostPerSub,
      sortOrder,
    };
  });

  const subtotal = lines.reduce(
    (sum, line) => sum.plus(line.lineTotal),
    decimal(0),
  );
  const discountAmount = decimal(input.discountAmount);
  if (discountAmount.gt(subtotal)) throw new SaleDomainError("discount");
  const total = subtotal.minus(discountAmount);
  const paidAmount = decimal(input.paidAmount);
  if (paidAmount.gt(total)) throw new SaleDomainError("paid");
  const remainingAmount = total.minus(paidAmount);
  if (remainingAmount.gt(0) && !input.customerId)
    throw new SaleDomainError("customer");

  const cashbox = await tx.cashbox.findUnique({
    where: { id: input.cashboxId },
  });
  if (!cashbox?.isActive) throw new SaleDomainError("cashbox");
  if (input.customerId) {
    const customer = await tx.customer.findUnique({
      where: { id: input.customerId },
    });
    if (!customer?.isActive) throw new SaleDomainError("customer");
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

async function moveStock(
  tx: Prisma.TransactionClient,
  input: {
    productId: string;
    quantity: Prisma.Decimal;
    cost: Prisma.Decimal;
    invoiceId: string;
    userId: string;
    note?: string;
  },
) {
  if (input.quantity.lt(0)) {
    const updated = await tx.product.updateMany({
      where: {
        id: input.productId,
        stockQty: { gte: input.quantity.negated() },
      },
      data: { stockQty: { decrement: input.quantity.negated() } },
    });
    if (updated.count !== 1) throw new SaleDomainError("stock");
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
      type: "SALE",
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
    customerId?: string | null;
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
      type: "SALE_PAYMENT",
      amount: input.amount,
      balanceAfter: cashbox.balance,
      refType: "INVOICE",
      refId: input.invoiceId,
      invoiceId: input.invoiceId,
      customerId: input.customerId,
      createdById: input.userId,
      note: input.note,
    },
  });
}

async function moveCustomerBalance(
  tx: Prisma.TransactionClient,
  input: {
    customerId?: string | null;
    amount: Prisma.Decimal;
    invoiceId: string;
    userId: string;
    note?: string;
  },
) {
  if (input.amount.isZero()) return;
  if (!input.customerId) throw new SaleDomainError("customer");
  const customer = await tx.customer.update({
    where: { id: input.customerId },
    data: { balance: { increment: input.amount } },
  });
  await tx.partyTransaction.create({
    data: {
      partyType: "CUSTOMER",
      customerId: input.customerId,
      type: "INVOICE",
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
}

export async function postSale(
  tx: Prisma.TransactionClient,
  input: {
    invoiceId: string;
    cashboxId: string;
    customerId?: string | null;
    sale: PreparedSale;
    userId: string;
  },
) {
  for (const line of input.sale.lines) {
    await moveStock(tx, {
      productId: line.productId,
      quantity: line.qtyInSub.negated(),
      cost: line.costPerSubAtSale,
      invoiceId: input.invoiceId,
      userId: input.userId,
    });
  }
  await moveCash(tx, {
    cashboxId: input.cashboxId,
    amount: input.sale.paidAmount,
    invoiceId: input.invoiceId,
    customerId: input.customerId,
    userId: input.userId,
  });
  await moveCustomerBalance(tx, {
    customerId: input.customerId,
    amount: input.sale.remainingAmount,
    invoiceId: input.invoiceId,
    userId: input.userId,
  });
}

export async function reverseSale(
  tx: Prisma.TransactionClient,
  invoice: SaleWithLines,
  userId: string,
  reason: string,
) {
  for (const line of invoice.lines.filter((entry) => entry.isCurrent)) {
    await moveStock(tx, {
      productId: line.productId,
      quantity: line.qtyInSub,
      cost: line.costPerSubAtSale,
      invoiceId: invoice.id,
      userId,
      note: reason,
    });
  }
  await moveCash(tx, {
    cashboxId: invoice.cashboxId,
    amount: invoice.paidAmount.negated(),
    invoiceId: invoice.id,
    customerId: invoice.customerId,
    userId,
    note: reason,
  });
  await moveCustomerBalance(tx, {
    customerId: invoice.customerId,
    amount: invoice.remainingAmount.negated(),
    invoiceId: invoice.id,
    userId,
    note: reason,
  });
}
