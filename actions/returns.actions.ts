"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import {
  AuthRequiredError,
  PermissionDeniedError,
  requirePermission,
} from "@/lib/auth-guard";
import { writeAudit } from "@/lib/audit";
import { fail, ok } from "@/lib/action-result";
import { nextDocumentNumber } from "@/lib/numbering";
import { prisma } from "@/lib/prisma";
import { postReturn, prepareReturn, ReturnDomainError } from "@/lib/returns-ledger";
import {
  cancelReturnSchema,
  createReturnSchema,
  originalInvoiceLinesSchema,
  returnIdSchema,
  returnsFilterSchema,
} from "@/lib/validations";
import messages from "@/messages/ar.json";
import type {
  ActionResult,
  InvoiceDetail,
  OriginalInvoiceLine,
  OriginalInvoiceOption,
  PrintInvoiceData,
  ReturnFormOptions,
  ReturnListRow,
  ReturnOriginalLinesResult,
  ReturnsPage,
} from "@/types";

const m = messages.returnsAction;
const txOptions = {
  isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
  timeout: 20_000,
};

async function returnTransaction<T>(
  work: (tx: Prisma.TransactionClient) => Promise<T>,
): Promise<T> {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      return await prisma.$transaction(work, txOptions);
    } catch (error) {
      if (
        !(
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === "P2034"
        ) ||
        attempt === 2
      )
        throw error;
    }
  }
  throw new ReturnDomainError("conflict");
}

function actionError<T>(error: unknown): ActionResult<T> {
  if (error instanceof AuthRequiredError) return fail(m.unauthorized);
  if (error instanceof PermissionDeniedError) return fail(m.forbidden);
  if (error instanceof ReturnDomainError) return fail(m[error.code]);
  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2034"
  )
    return fail(m.conflict);
  console.error("Return action failed", error);
  return fail(m.failed);
}

async function createReturn(
  documentType: "SALE_RETURN" | "PURCHASE_RETURN",
  originalType: "SALE" | "PURCHASE",
  input: unknown,
): Promise<ActionResult<{ id: string; number: number }>> {
  try {
    const user = await requirePermission("return.create");
    const parsed = createReturnSchema.safeParse(input);
    if (!parsed.success)
      return fail(m.invalid, parsed.error.flatten().fieldErrors);
    const created = await returnTransaction(async (tx) => {
      const { prepared, original } = await prepareReturn(
        tx,
        {
          originalInvoiceId: parsed.data.originalInvoiceId,
          cashboxId: parsed.data.cashboxId,
          lines: parsed.data.lines,
        },
        originalType,
      );
      const number = await nextDocumentNumber(tx, documentType);
      const invoice = await tx.invoice.create({
        data: {
          number,
          type: documentType,
          paymentStatus: "PAID",
          customerId: originalType === "SALE" ? original.customerId : undefined,
          supplierId: originalType === "PURCHASE" ? original.supplierId : undefined,
          cashboxId: parsed.data.cashboxId,
          originalInvoiceId: original.id,
          subtotal: prepared.subtotal,
          discountAmount: prepared.discountAmount,
          total: prepared.total,
          paidAmount: prepared.total,
          remainingAmount: new Prisma.Decimal(0),
          notes: parsed.data.notes,
          createdById: user.id,
          lines: {
            createMany: {
              data: prepared.lines.map((line) => ({
                productId: line.productId,
                productName: line.productName,
                unitName: line.unitName,
                unitType: line.unitType,
                unitsPerBaseSnapshot: line.unitsPerBaseSnapshot,
                qtyInUnit: line.qtyInUnit,
                qtyInSub: line.qtyInSub,
                unitPrice: line.unitPrice,
                lineTotal: line.lineTotal,
                costPerSubAtSale: line.costPerSubAtSale,
                sortOrder: line.sortOrder,
              })),
            },
          },
        },
      });
      await postReturn(tx, {
        invoiceId: invoice.id,
        cashboxId: parsed.data.cashboxId,
        documentType,
        customerId: originalType === "SALE" ? original.customerId : undefined,
        supplierId: originalType === "PURCHASE" ? original.supplierId : undefined,
        settleFromCashbox: parsed.data.settleFromCashbox,
        prepared,
        userId: user.id,
      });
      await writeAudit(tx, {
        userId: user.id,
        action: documentType === "SALE_RETURN" ? "return.sale.create" : "return.purchase.create",
        entityType: "Invoice",
        entityId: invoice.id,
        entityLabel: `#${String(number).padStart(6, "0")}`,
        after: { number, total: prepared.total, lines: prepared.lines, originalInvoiceId: original.id },
      });
      return { id: invoice.id, number };
    });
    revalidatePath(documentType === "SALE_RETURN" ? "/sales-returns" : "/purchase-returns");
    revalidatePath("/inventory");
    return ok(created);
  } catch (error) {
    return actionError(error);
  }
}

export async function createSaleReturn(input: unknown) {
  return createReturn("SALE_RETURN", "SALE", input);
}

export async function createPurchaseReturn(input: unknown) {
  return createReturn("PURCHASE_RETURN", "PURCHASE", input);
}

export async function cancelReturn(
  input: unknown,
): Promise<ActionResult<{ id: string; number: number }>> {
  try {
    const user = await requirePermission("return.cancel");
    const parsed = cancelReturnSchema.safeParse(input);
    if (!parsed.success)
      return fail(m.invalid, parsed.error.flatten().fieldErrors);
    const cancelled = await returnTransaction(async (tx) => {
      const invoice = await tx.invoice.findFirst({
        where: {
          id: parsed.data.id,
          type: { in: ["SALE_RETURN", "PURCHASE_RETURN"] },
        },
        include: { lines: { where: { isCurrent: true } } },
      });
      if (!invoice) throw new ReturnDomainError("notFound");
      if (invoice.status === "CANCELLED") throw new ReturnDomainError("cancelled");

      const changed = await tx.invoice.updateMany({
        where: { id: invoice.id, status: "CONFIRMED" },
        data: {
          status: "CANCELLED",
          cancelledAt: new Date(),
          cancelledById: user.id,
          cancelReason: parsed.data.reason,
        },
      });
      if (changed.count !== 1) throw new ReturnDomainError("conflict");

      const isSaleReturn = invoice.type === "SALE_RETURN";
      const documentType = isSaleReturn ? "SALE_RETURN" : "PURCHASE_RETURN";
      const stockSign = isSaleReturn ? -1 : 1;
      for (const line of invoice.lines) {
        const before = await tx.product.findUniqueOrThrow({
          where: { id: line.productId },
          select: { stockQty: true },
        });
        const signedQty = line.qtyInSub.mul(stockSign);
        if (signedQty.lt(0)) {
          const updated = await tx.product.updateMany({
            where: { id: line.productId, stockQty: { gte: signedQty.negated() } },
            data: { stockQty: { decrement: signedQty.negated() } },
          });
          if (updated.count !== 1) throw new ReturnDomainError("exceedsOriginal");
        } else {
          await tx.product.update({
            where: { id: line.productId },
            data: { stockQty: { increment: signedQty } },
          });
        }
        const after = await tx.product.findUniqueOrThrow({
          where: { id: line.productId },
          select: { stockQty: true },
        });
        await tx.stockMovement.create({
          data: {
            productId: line.productId,
            type: documentType,
            qtyInSub: signedQty,
            balanceAfter: after.stockQty,
            unitCostPerSub: line.costPerSubAtSale,
            refType: "INVOICE",
            refId: invoice.id,
            invoiceId: invoice.id,
            createdById: user.id,
            note: parsed.data.reason,
          },
        });
        void before;
      }

      // A return is always settled in full at creation (`paymentStatus: PAID`), so
      // reversing it always reverses the full total — split settlement is not modeled.
      const cashSign = isSaleReturn ? 1 : -1;
      const cashbox = await tx.cashbox.update({
        where: { id: invoice.cashboxId },
        data: { balance: { increment: invoice.total.mul(cashSign) } },
      });
      await tx.cashMovement.create({
        data: {
          cashboxId: invoice.cashboxId,
          type: isSaleReturn ? "SALE_RETURN_REFUND" : "PURCHASE_RETURN_REFUND",
          amount: invoice.total.mul(cashSign),
          balanceAfter: cashbox.balance,
          refType: "INVOICE",
          refId: invoice.id,
          invoiceId: invoice.id,
          customerId: isSaleReturn ? invoice.customerId : undefined,
          supplierId: !isSaleReturn ? invoice.supplierId : undefined,
          createdById: user.id,
          note: parsed.data.reason,
        },
      });

      await writeAudit(tx, {
        userId: user.id,
        action: isSaleReturn ? "return.sale.delete" : "return.purchase.delete",
        entityType: "Invoice",
        entityId: invoice.id,
        entityLabel: `#${String(invoice.number).padStart(6, "0")}`,
        before: { status: invoice.status },
        after: undefined,
      });
      await tx.invoice.delete({ where: { id: invoice.id } });
      return { id: invoice.id, number: invoice.number };
    });
    revalidatePath("/sales-returns");
    revalidatePath("/purchase-returns");
    revalidatePath("/inventory");
    return ok(cancelled);
  } catch (error) {
    return actionError(error);
  }
}

async function getReturns(
  documentType: "SALE_RETURN" | "PURCHASE_RETURN",
  input: unknown,
): Promise<ActionResult<ReturnsPage>> {
  try {
    await requirePermission("return.view");
    const parsed = returnsFilterSchema.safeParse(input);
    if (!parsed.success)
      return fail(m.invalid, parsed.error.flatten().fieldErrors);
    const f = parsed.data;
    const parsedNumber =
      f.q && /^#?\d+$/.test(f.q) ? Number(f.q.replace("#", "")) : null;
    const number = parsedNumber !== null && Number.isSafeInteger(parsedNumber) && parsedNumber <= 2_147_483_647
      ? parsedNumber : null;
    const isSaleReturn = documentType === "SALE_RETURN";
    const where: Prisma.InvoiceWhereInput = {
      type: documentType,
      cashboxId: f.cashboxId,
      ...(isSaleReturn ? { customerId: f.partyId } : { supplierId: f.partyId }),
      issuedAt:
        f.from || f.to
          ? {
              gte: f.from ? new Date(`${f.from}T00:00:00Z`) : undefined,
              lt: f.to ? new Date(Date.parse(`${f.to}T00:00:00Z`) + 86_400_000) : undefined,
            }
          : undefined,
      OR: f.q
        ? [
            ...(number !== null ? [{ number }] : []),
            isSaleReturn
              ? { customer: { name: { contains: f.q, mode: "insensitive" as const } } }
              : { supplier: { name: { contains: f.q, mode: "insensitive" as const } } },
          ]
        : undefined,
    };
    const [totalCount, invoices] = await prisma.$transaction([
      prisma.invoice.count({ where }),
      prisma.invoice.findMany({
        where,
        orderBy: [{ [f.sortBy]: f.sortDirection }, { id: "desc" }],
        skip: (f.page - 1) * f.pageSize,
        take: f.pageSize,
        include: {
          customer: { select: { name: true } },
          supplier: { select: { name: true } },
          cashbox: { select: { name: true } },
          createdBy: { select: { displayName: true } },
        },
      }),
    ]);
    const rows: ReturnListRow[] = invoices.map((invoice) => ({
      id: invoice.id,
      number: invoice.number,
      status: invoice.status,
      paymentStatus: invoice.paymentStatus as ReturnListRow["paymentStatus"],
      issuedAt: invoice.issuedAt.toISOString(),
      partyName: (isSaleReturn ? invoice.customer?.name : invoice.supplier?.name) ?? "",
      cashboxName: invoice.cashbox.name,
      userName: invoice.createdBy.displayName,
      total: invoice.total.toString(),
    }));
    return ok({ rows, totalCount, page: f.page, pageSize: f.pageSize });
  } catch (error) {
    return actionError(error);
  }
}

export async function getSaleReturns(input: unknown) {
  return getReturns("SALE_RETURN", input);
}

export async function getPurchaseReturns(input: unknown) {
  return getReturns("PURCHASE_RETURN", input);
}

async function getReturnFormOptions(
  originalType: "SALE" | "PURCHASE",
): Promise<ActionResult<ReturnFormOptions>> {
  try {
    await requirePermission("return.create");
    const [invoices, cashboxes] = await prisma.$transaction([
      prisma.invoice.findMany({
        where: { type: originalType, status: "CONFIRMED" },
        orderBy: { issuedAt: "desc" },
        take: 100,
        include: {
          customer: { select: { name: true } },
          supplier: { select: { name: true } },
        },
      }),
      prisma.cashbox.findMany({
        where: { isActive: true },
        orderBy: { sortOrder: "asc" },
        select: { id: true, name: true },
      }),
    ]);
    const originalInvoices: OriginalInvoiceOption[] = invoices.map((invoice) => ({
      id: invoice.id,
      number: invoice.number,
      partyName: (originalType === "SALE" ? invoice.customer?.name : invoice.supplier?.name)
        ?? messages.invoices.list.walkInCustomer,
      issuedAt: invoice.issuedAt.toISOString(),
      total: invoice.total.toString(),
    }));
    return ok({ originalInvoices, cashboxes: cashboxes.map((c) => ({ value: c.id, label: c.name })) });
  } catch (error) {
    return actionError(error);
  }
}

export async function getSaleReturnFormOptions() {
  return getReturnFormOptions("SALE");
}

/** Party options for the returns-list filter — real customer/supplier ids, unlike the per-invoice picker above. */
async function getReturnListFilterOptions(
  partyType: "CUSTOMER" | "SUPPLIER",
): Promise<ActionResult<{ id: string; name: string }[]>> {
  try {
    await requirePermission("return.view");
    const parties =
      partyType === "CUSTOMER"
        ? await prisma.customer.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } })
        : await prisma.supplier.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } });
    return ok(parties);
  } catch (error) {
    return actionError(error);
  }
}

export async function getSaleReturnListFilterOptions() {
  return getReturnListFilterOptions("CUSTOMER");
}

export async function getPurchaseReturnListFilterOptions() {
  return getReturnListFilterOptions("SUPPLIER");
}

export async function getPurchaseReturnFormOptions() {
  return getReturnFormOptions("PURCHASE");
}

/** Lines still returnable on one original invoice, fetched when the picker selects it. */
async function getOriginalInvoiceLines(
  originalType: "SALE" | "PURCHASE",
  input: unknown,
): Promise<ActionResult<ReturnOriginalLinesResult>> {
  try {
    await requirePermission("return.create");
    const parsed = originalInvoiceLinesSchema.safeParse(input);
    if (!parsed.success) return fail(m.invalid);
    const invoice = await prisma.invoice.findFirst({
      where: { id: parsed.data, type: originalType, status: "CONFIRMED" },
      include: {
        customer: { select: { id: true, name: true } },
        supplier: { select: { id: true, name: true } },
        lines: { where: { isCurrent: true }, orderBy: { sortOrder: "asc" } },
        returns: {
          where: { status: "CONFIRMED" },
          include: { lines: { where: { isCurrent: true } } },
        },
      },
    });
    if (!invoice) return fail(m.notFound);

    const returnedByProduct = new Map<string, Prisma.Decimal>();
    for (const ret of invoice.returns) {
      for (const line of ret.lines) {
        const running = returnedByProduct.get(line.productId) ?? new Prisma.Decimal(0);
        returnedByProduct.set(line.productId, running.plus(line.qtyInSub));
      }
    }

    const lines: OriginalInvoiceLine[] = invoice.lines.map((line) => {
      const returnedInSub = returnedByProduct.get(line.productId) ?? new Prisma.Decimal(0);
      const returnedInUnit =
        line.unitType === "BASE" ? returnedInSub.div(line.unitsPerBaseSnapshot) : returnedInSub;
      return {
        id: line.id,
        productId: line.productId,
        productName: line.productName,
        unitName: line.unitName,
        unitType: line.unitType,
        unitsPerBase: line.unitsPerBaseSnapshot.toNumber(),
        qtyInvoiced: line.qtyInUnit.toNumber(),
        qtyAlreadyReturned: returnedInUnit.toNumber(),
        unitPrice: line.unitPrice.toString(),
      };
    });

    const party = originalType === "SALE" ? invoice.customer : invoice.supplier;
    return ok({
      partyId: party?.id ?? null,
      partyName: party?.name ?? messages.invoices.list.walkInCustomer,
      lines,
    });
  } catch (error) {
    return actionError(error);
  }
}

export async function getSaleOriginalInvoiceLines(input: unknown) {
  return getOriginalInvoiceLines("SALE", input);
}

export async function getPurchaseOriginalInvoiceLines(input: unknown) {
  return getOriginalInvoiceLines("PURCHASE", input);
}

async function getReturnById(
  documentType: "SALE_RETURN" | "PURCHASE_RETURN",
  input: unknown,
): Promise<ActionResult<InvoiceDetail>> {
  try {
    await requirePermission("return.view");
    const parsed = returnIdSchema.safeParse(input);
    if (!parsed.success) return fail(m.invalid);
    const isSaleReturn = documentType === "SALE_RETURN";
    const invoice = await prisma.invoice.findFirst({
      where: { id: parsed.data, type: documentType },
      include: {
        customer: { select: { name: true, phone: true, balance: true } },
        supplier: { select: { name: true, phone: true, balance: true } },
        cashbox: { select: { name: true } },
        createdBy: { select: { displayName: true } },
        cancelledBy: { select: { displayName: true } },
        lines: { where: { isCurrent: true }, orderBy: { sortOrder: "asc" } },
      },
    });
    if (!invoice) return fail(m.notFound);
    const party = isSaleReturn ? invoice.customer : invoice.supplier;
    return ok({
      id: invoice.id,
      number: invoice.number,
      type: documentType,
      status: invoice.status,
      paymentStatus: invoice.paymentStatus,
      partyName: party?.name ?? messages.invoices.list.walkInCustomer,
      partyId: (isSaleReturn ? invoice.customerId : invoice.supplierId) ?? undefined,
      partyPhone: party?.phone ?? undefined,
      partyBalance: party?.balance.toString() ?? undefined,
      cashboxName: invoice.cashbox.name,
      userName: invoice.createdBy.displayName,
      issuedAt: invoice.issuedAt.toISOString(),
      subtotal: invoice.subtotal.toString(),
      discountAmount: invoice.discountAmount.toString(),
      total: invoice.total.toString(),
      paidAmount: invoice.paidAmount.toString(),
      remainingAmount: invoice.remainingAmount.toString(),
      notes: invoice.notes ?? undefined,
      cancelledAt: invoice.cancelledAt?.toISOString() ?? undefined,
      cancelledByName: invoice.cancelledBy?.displayName ?? undefined,
      cancelReason: invoice.cancelReason ?? undefined,
      lines: invoice.lines.map((line) => ({
        id: line.id,
        productName: line.productName,
        unitName: line.unitName,
        qty: line.qtyInUnit.toNumber(),
        unitPrice: line.unitPrice.toString(),
        lineTotal: line.lineTotal.toString(),
      })),
    });
  } catch (error) {
    return actionError(error);
  }
}

export async function getSaleReturnById(input: unknown) {
  return getReturnById("SALE_RETURN", input);
}

export async function getPurchaseReturnById(input: unknown) {
  return getReturnById("PURCHASE_RETURN", input);
}

/** Real return data for the shared print-preview route (A4 / A5 / 80 mm). */
export async function getReturnPrintData(
  input: unknown,
): Promise<ActionResult<PrintInvoiceData>> {
  try {
    await requirePermission("return.view");
    const parsed = returnIdSchema.safeParse(input);
    if (!parsed.success) return fail(m.invalid);

    const [invoice, settings] = await prisma.$transaction([
      prisma.invoice.findFirst({
        where: { id: parsed.data, type: { in: ["SALE_RETURN", "PURCHASE_RETURN"] } },
        include: {
          customer: { select: { name: true, phone: true, address: true } },
          supplier: { select: { name: true, phone: true, address: true } },
          createdBy: { select: { displayName: true } },
          lines: { where: { isCurrent: true }, orderBy: { sortOrder: "asc" }, include: { product: { select: { sku: true } } } },
        },
      }),
      prisma.setting.findMany({
        where: { key: { in: ["shop.name", "shop.phone", "shop.phone2", "shop.address", "shop.invoiceFooter", "shop.taxNote"] } },
      }),
    ]);
    if (!invoice) return fail(m.notFound);

    const setting = (key: string): string | undefined => {
      const value = settings.find((entry) => entry.key === key)?.value;
      return typeof value === "string" && value ? value : undefined;
    };

    const isSaleReturn = invoice.type === "SALE_RETURN";
    const party = isSaleReturn ? invoice.customer : invoice.supplier;

    return ok({
      shop: {
        name: setting("shop.name") ?? messages.app.name,
        phone: setting("shop.phone") ?? "",
        phone2: setting("shop.phone2"),
        address: setting("shop.address") ?? "",
        taxNote: setting("shop.taxNote"),
        invoiceFooter: setting("shop.invoiceFooter"),
      },
      documentTypeLabel: isSaleReturn
        ? messages.invoices.print.documentTypeSaleReturn
        : messages.invoices.print.documentTypePurchaseReturn,
      number: invoice.number,
      issuedAt: invoice.issuedAt.toISOString(),
      cashierName: invoice.createdBy.displayName,
      partyLabel: isSaleReturn ? messages.invoices.party.SALE : messages.invoices.party.PURCHASE,
      partyName: party?.name ?? messages.invoices.list.walkInCustomer,
      partyPhone: party?.phone ?? undefined,
      partyAddress: party?.address ?? undefined,
      lines: invoice.lines.map((line) => ({
        productCode: line.product.sku,
        productName: line.productName,
        unitName: line.unitName,
        qty: line.qtyInUnit.toNumber(),
        unitPrice: line.unitPrice.toString(),
        lineTotal: line.lineTotal.toString(),
      })),
      subtotal: invoice.subtotal.toString(),
      discountAmount: invoice.discountAmount.toString(),
      total: invoice.total.toString(),
      paidAmount: invoice.paidAmount.toString(),
      remainingAmount: invoice.remainingAmount.toString(),
    });
  } catch (error) {
    return actionError(error);
  }
}
