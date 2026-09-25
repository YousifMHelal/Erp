"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import {
  AuthRequiredError,
  PermissionDeniedError,
  requirePermission,
} from "@/lib/auth-guard";
import { writeAudit } from "@/lib/audit";
import { restampDocumentCash } from "@/lib/cash-ledger";
import { isClientRequestIdConflict } from "@/lib/idempotency";
import { restampDocumentPartyEntries } from "@/lib/party-ledger";
import { fail, ok } from "@/lib/action-result";
import { logError } from "@/lib/logger";
import { formatShopTime, shopDayEnd, shopDayStart } from "@/lib/format";
import { nextDocumentNumber } from "@/lib/numbering";
import { suggestSellPrice } from "@/lib/pricing";
import { prisma } from "@/lib/prisma";
import {
  postSale,
  prepareSale,
  reverseSale,
  SaleDomainError,
} from "@/lib/sales-ledger";
import {
  cancelSaleSchema,
  createSaleSchema,
  priceSuggestionSchema,
  productSearchSchema,
  saleIdSchema,
  salesFilterSchema,
  updateSaleSchema,
} from "@/lib/validations";
import messages from "@/messages/ar.json";
import type {
  ActionResult,
  PrintInvoiceData,
  SaleDetail,
  SaleEditData,
  SaleFormOptions,
  SaleListFilterOptions,
  SaleListRow,
  SaleProductOption,
  SalesPage,
  SuggestedPrice,
} from "@/types";

const m = messages.salesAction;
const txOptions = {
  isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
  timeout: 20_000,
};

async function saleTransaction<T>(
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
  throw new SaleDomainError("conflict");
}

function actionError<T>(error: unknown): ActionResult<T> {
  if (error instanceof AuthRequiredError) return fail(m.unauthorized);
  if (error instanceof PermissionDeniedError) return fail(m.forbidden);
  if (error instanceof SaleDomainError) return fail(m[error.code]);
  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2034"
  )
    return fail(m.conflict);
  logError("Sale action failed", error);
  return fail(m.failed);
}

export async function createSale(
  input: unknown,
): Promise<ActionResult<{ id: string; number: number }>> {
  try {
    const user = await requirePermission("sale.create");
    const parsed = createSaleSchema.safeParse(input);
    if (!parsed.success)
      return fail(m.invalid, parsed.error.flatten().fieldErrors);
    if (parsed.data.clientRequestId) {
      const existing = await prisma.invoice.findUnique({
        where: { clientRequestId: parsed.data.clientRequestId },
        select: { id: true, number: true },
      });
      if (existing) return ok(existing);
    }
    const invoice = await saleTransaction(async (tx) => {
      const sale = await prepareSale(tx, parsed.data);
      const number = await nextDocumentNumber(tx, "SALE");
      const created = await tx.invoice.create({
        data: {
          number,
          clientRequestId: parsed.data.clientRequestId,
          type: "SALE",
          paymentStatus: sale.paymentStatus,
          customerId: parsed.data.customerId,
          cashboxId: parsed.data.cashboxId,
          subtotal: sale.subtotal,
          discountAmount: sale.discountAmount,
          total: sale.total,
          paidAmount: sale.paidAmount,
          remainingAmount: sale.remainingAmount,
          notes: parsed.data.notes,
          issuedAt: parsed.data.issuedAt
            ? shopDayStart(parsed.data.issuedAt)
            : new Date(),
          createdById: user.id,
          lines: { createMany: { data: sale.lines } },
        },
      });
      await postSale(tx, {
        invoiceId: created.id,
        cashboxId: created.cashboxId,
        customerId: created.customerId,
        sale,
        userId: user.id,
      });
      await writeAudit(tx, {
        userId: user.id,
        action: "sale.create",
        entityType: "Invoice",
        entityId: created.id,
        entityLabel: `#${String(number).padStart(6, "0")}`,
        after: {
          number,
          total: sale.total,
          paidAmount: sale.paidAmount,
          remainingAmount: sale.remainingAmount,
          lines: sale.lines,
        },
      });
      return { id: created.id, number };
    });
    revalidatePath("/sales");
    revalidatePath("/inventory");
    return ok(invoice);
  } catch (error) {
    if (isClientRequestIdConflict(error)) {
      const raced = await prisma.invoice.findFirst({
        where: { clientRequestId: (input as { clientRequestId?: string }).clientRequestId },
        select: { id: true, number: true },
      });
      if (raced) return ok(raced);
    }
    return actionError(error);
  }
}

export async function updateSale(
  input: unknown,
): Promise<ActionResult<{ id: string; number: number }>> {
  try {
    const user = await requirePermission("sale.edit");
    const parsed = updateSaleSchema.safeParse(input);
    if (!parsed.success)
      return fail(m.invalid, parsed.error.flatten().fieldErrors);
    const updated = await saleTransaction(async (tx) => {
      const old = await tx.invoice.findFirst({
        where: { id: parsed.data.id, type: "SALE" },
        include: { lines: true, returns: true },
      });
      if (!old) throw new SaleDomainError("notFound");
      if (old.status === "CANCELLED") throw new SaleDomainError("cancelled");
      if (old.returns.some((entry) => entry.status === "CONFIRMED"))
        throw new SaleDomainError("hasReturns");
      if (old.updatedAt.getTime() !== parsed.data.updatedAt.getTime())
        throw new SaleDomainError("conflict");
      const sale = await prepareSale(tx, parsed.data);
      const changed = await tx.invoice.updateMany({
        where: { id: old.id, status: "CONFIRMED", updatedAt: old.updatedAt },
        data: {
          customerId: parsed.data.customerId,
          cashboxId: parsed.data.cashboxId,
          subtotal: sale.subtotal,
          discountAmount: sale.discountAmount,
          total: sale.total,
          paidAmount: sale.paidAmount,
          remainingAmount: sale.remainingAmount,
          paymentStatus: sale.paymentStatus,
          notes: parsed.data.notes,
          issuedAt: parsed.data.issuedAt
            ? shopDayStart(parsed.data.issuedAt)
            : old.issuedAt,
        },
      });
      if (changed.count !== 1) throw new SaleDomainError("conflict");
      const removed = await reverseSale(tx, old, user.id, "sale.edit");
      await tx.invoiceLine.updateMany({
        where: { invoiceId: old.id, isCurrent: true },
        data: { isCurrent: false },
      });
      await tx.invoiceLine.createMany({
        data: sale.lines.map((line) => ({ ...line, invoiceId: old.id })),
      });
      await postSale(tx, {
        invoiceId: old.id,
        cashboxId: parsed.data.cashboxId,
        customerId: parsed.data.customerId,
        sale,
        userId: user.id,
      });
      await restampDocumentCash(tx, { refType: "INVOICE", refId: old.id }, removed.removedCash.firstMovedAt);
      await restampDocumentPartyEntries(tx, { refType: "INVOICE", refId: old.id }, removed.removedParty);
      await writeAudit(tx, {
        userId: user.id,
        action: "sale.edit",
        entityType: "Invoice",
        entityId: old.id,
        entityLabel: `#${String(old.number).padStart(6, "0")}`,
        before: {
          customerId: old.customerId,
          cashboxId: old.cashboxId,
          total: old.total,
          paidAmount: old.paidAmount,
          lines: old.lines.filter((line) => line.isCurrent),
        },
        after: {
          customerId: parsed.data.customerId,
          cashboxId: parsed.data.cashboxId,
          total: sale.total,
          paidAmount: sale.paidAmount,
          lines: sale.lines,
        },
      });
      return { id: old.id, number: old.number };
    });
    revalidatePath("/sales");
    revalidatePath(`/sales/${updated.id}`);
    revalidatePath("/inventory");
    return ok(updated);
  } catch (error) {
    return actionError(error);
  }
}

export async function cancelSale(
  input: unknown,
): Promise<ActionResult<{ id: string; number: number }>> {
  try {
    const user = await requirePermission("sale.cancel");
    const parsed = cancelSaleSchema.safeParse(input);
    if (!parsed.success)
      return fail(m.invalid, parsed.error.flatten().fieldErrors);
    const cancelled = await saleTransaction(async (tx) => {
      const invoice = await tx.invoice.findFirst({
        where: { id: parsed.data.id, type: "SALE" },
        include: { lines: true, returns: true },
      });
      if (!invoice) throw new SaleDomainError("notFound");
      if (invoice.status === "CANCELLED")
        throw new SaleDomainError("cancelled");
      if (invoice.returns.some((entry) => entry.status === "CONFIRMED"))
        throw new SaleDomainError("hasReturns");
      const claimed = await tx.invoice.updateMany({
        where: { id: invoice.id, status: "CONFIRMED" },
        data: { status: "CANCELLED", cancelledAt: new Date(), cancelledById: user.id, cancelReason: parsed.data.reason },
      });
      if (claimed.count !== 1) throw new SaleDomainError("conflict");
      await reverseSale(tx, invoice, user.id, parsed.data.reason);
      await writeAudit(tx, {
        userId: user.id,
        action: "sale.delete",
        entityType: "Invoice",
        entityId: invoice.id,
        entityLabel: `#${String(invoice.number).padStart(6, "0")}`,
        before: {
          status: invoice.status,
          total: invoice.total,
          paidAmount: invoice.paidAmount,
        },
        after: undefined,
      });
      await tx.invoice.delete({ where: { id: invoice.id } });
      return { id: invoice.id, number: invoice.number };
    });
    revalidatePath("/sales");
    revalidatePath(`/sales/${cancelled.id}`);
    revalidatePath("/inventory");
    return ok(cancelled);
  } catch (error) {
    return actionError(error);
  }
}

export async function getSales(
  input: unknown,
): Promise<ActionResult<SalesPage>> {
  try {
    await requirePermission("sale.view");
    const parsed = salesFilterSchema.safeParse(input);
    if (!parsed.success)
      return fail(m.invalid, parsed.error.flatten().fieldErrors);
    const f = parsed.data;
    const parsedNumber =
      f.q && /^#?\d+$/.test(f.q) ? Number(f.q.replace("#", "")) : null;
    const number = parsedNumber !== null && Number.isSafeInteger(parsedNumber) && parsedNumber <= 2_147_483_647
      ? parsedNumber : null;
    const where: Prisma.InvoiceWhereInput = {
      type: "SALE",
      customerId: f.customerId,
      cashboxId: f.cashboxId,
      paymentStatus: f.paymentStatus,
      createdById: f.userId,
      issuedAt:
        f.from || f.to
          ? {
              gte: f.from ? shopDayStart(f.from) : undefined,
              lt: f.to ? shopDayEnd(f.to) : undefined,
            }
          : undefined,
      OR: f.q
        ? [
            ...(number !== null ? [{ number }] : []),
            { customer: { name: { contains: f.q, mode: "insensitive" } } },
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
          cashbox: { select: { name: true } },
          createdBy: { select: { displayName: true } },
        },
      }),
    ]);
    const rows: SaleListRow[] = invoices.map((invoice) => ({
      id: invoice.id,
      number: invoice.number,
      status: invoice.status,
      paymentStatus: invoice.paymentStatus,
      issuedAt: invoice.issuedAt.toISOString(),
      customerName: invoice.customer?.name ?? null,
      cashierName: invoice.createdBy.displayName,
      cashboxName: invoice.cashbox.name,
      total: invoice.total.toString(),
      paidAmount: invoice.paidAmount.toString(),
      remainingAmount: invoice.remainingAmount.toString(),
    }));
    return ok({ rows, totalCount, page: f.page, pageSize: f.pageSize });
  } catch (error) {
    return actionError(error);
  }
}

export async function getSaleById(
  input: unknown,
): Promise<ActionResult<SaleDetail>> {
  try {
    await requirePermission("sale.view");
    const parsed = saleIdSchema.safeParse(input);
    if (!parsed.success) return fail(m.invalid);
    const invoice = await prisma.invoice.findFirst({
      where: { id: parsed.data, type: "SALE" },
      include: {
        customer: { select: { name: true, phone: true, balance: true } },
        cashbox: { select: { name: true } },
        createdBy: { select: { displayName: true } },
        cancelledBy: { select: { displayName: true } },
        lines: {
          where: { isCurrent: true },
          orderBy: { sortOrder: "asc" },
          include: { product: { select: { sku: true } } },
        },
      },
    });
    if (!invoice) return fail(m.notFound);
    return ok({
      id: invoice.id,
      number: invoice.number,
      status: invoice.status,
      paymentStatus: invoice.paymentStatus,
      issuedAt: invoice.issuedAt.toISOString(),
      customerName: invoice.customer?.name ?? null,
      cashierName: invoice.createdBy.displayName,
      cashboxName: invoice.cashbox.name,
      total: invoice.total.toString(),
      paidAmount: invoice.paidAmount.toString(),
      remainingAmount: invoice.remainingAmount.toString(),
      customerId: invoice.customerId,
      customerPhone: invoice.customer?.phone ?? null,
      customerBalance: invoice.customer?.balance.toString() ?? null,
      cashboxId: invoice.cashboxId,
      notes: invoice.notes,
      cancelledAt: invoice.cancelledAt?.toISOString() ?? null,
      cancelledByName: invoice.cancelledBy?.displayName ?? null,
      updatedAt: invoice.updatedAt.toISOString(),
      subtotal: invoice.subtotal.toString(),
      discountAmount: invoice.discountAmount.toString(),
      cancelReason: invoice.cancelReason,
      lines: invoice.lines.map((line) => ({
        id: line.id,
        productId: line.productId,
        productName: line.productName,
        sku: line.product.sku,
        unitName: line.unitName,
        unitType: line.unitType,
        qtyInUnit: line.qtyInUnit.toString(),
        qtyInSub: line.qtyInSub.toString(),
        unitPrice: line.unitPrice.toString(),
        lineTotal: line.lineTotal.toString(),
      })),
    });
  } catch (error) {
    return actionError(error);
  }
}

export async function getSaleFormOptions(): Promise<
  ActionResult<SaleFormOptions>
> {
  try {
    await requirePermission("sale.create");
    const [customers, cashboxes] = await prisma.$transaction([
      prisma.customer.findMany({
        where: { isActive: true },
        orderBy: { name: "asc" },
        select: { id: true, name: true },
      }),
      prisma.cashbox.findMany({
        where: { isActive: true },
        orderBy: { sortOrder: "asc" },
        select: { id: true, name: true },
      }),
    ]);
    return ok({ customers, cashboxes });
  } catch (error) {
    return actionError(error);
  }
}

export async function searchSaleProducts(
  input: unknown,
): Promise<ActionResult<SaleProductOption[]>> {
  try {
    await requirePermission("sale.create");
    const parsed = productSearchSchema.safeParse(input);
    if (!parsed.success) return fail(m.invalid);
    const query = parsed.data;
    const exact = query
      ? await prisma.product.findFirst({
          where: { barcode: query, isActive: true },
        })
      : null;
    const products = exact
      ? [exact]
      : await prisma.product.findMany({
          where: {
            isActive: true,
            OR: query
              ? [
                  { name: { contains: query, mode: "insensitive" } },
                  { sku: { contains: query, mode: "insensitive" } },
                  { barcode: { contains: query } },
                ]
              : undefined,
          },
          orderBy: { name: "asc" },
          take: 20,
        });
    return ok(
      products.map((product) => ({
        id: product.id,
        name: product.name,
        sku: product.sku,
        barcode: product.barcode,
        baseUnitName: product.baseUnitName,
        subUnitName: product.subUnitName,
        unitsPerBase: product.unitsPerBase.toString(),
        stockQty: product.stockQty.toString(),
        pricePerBase: product.sellPricePerBase.toString(),
        pricePerSub: product.sellPricePerBase
          .div(product.unitsPerBase)
          .toDecimalPlaces(4)
          .toString(),
        exactBarcodeMatch: exact?.id === product.id,
      })),
    );
  } catch (error) {
    return actionError(error);
  }
}

export async function getSalePriceSuggestion(
  input: unknown,
): Promise<
  ActionResult<{ pricePerSub: string; source: SuggestedPrice["source"] }>
> {
  try {
    await requirePermission("sale.create");
    const parsed = priceSuggestionSchema.safeParse(input);
    if (!parsed.success)
      return fail(m.invalid, parsed.error.flatten().fieldErrors);
    const suggestion = await prisma.$transaction((tx) =>
      suggestSellPrice(tx, parsed.data.productId, parsed.data.customerId),
    );
    return ok({
      pricePerSub: suggestion.pricePerSub.toDecimalPlaces(4).toString(),
      source: suggestion.source,
    });
  } catch (error) {
    return actionError(error);
  }
}

/**
 * Options for the sales-list filter bar. Separate from `getSaleFormOptions`
 * because listing is gated on `sale.view` while creating needs `sale.create`,
 * and the list also filters by cashier.
 */
export async function getSaleListFilterOptions(): Promise<
  ActionResult<SaleListFilterOptions>
> {
  try {
    await requirePermission("sale.view");
    const [customers, cashboxes, users] = await prisma.$transaction([
      prisma.customer.findMany({
        orderBy: { name: "asc" },
        select: { id: true, name: true },
      }),
      prisma.cashbox.findMany({
        orderBy: { sortOrder: "asc" },
        select: { id: true, name: true },
      }),
      prisma.user.findMany({
        orderBy: { displayName: "asc" },
        select: { id: true, displayName: true },
      }),
    ]);
    return ok({
      customers,
      cashboxes,
      users: users.map((user) => ({ id: user.id, name: user.displayName })),
    });
  } catch (error) {
    return actionError(error);
  }
}

/**
 * Everything the edit form needs: the sale itself, the pickers, and the stock each
 * line may reoccupy. An invoice's own quantities are already deducted from stock,
 * so the ceiling for a line is current stock plus what that invoice currently holds.
 */
export async function getSaleForEdit(
  input: unknown,
): Promise<ActionResult<SaleEditData>> {
  try {
    await requirePermission("sale.edit");
    const parsed = saleIdSchema.safeParse(input);
    if (!parsed.success) return fail(m.invalid);

    const invoice = await prisma.invoice.findFirst({
      where: { id: parsed.data, type: "SALE" },
      include: {
        lines: {
          where: { isCurrent: true },
          orderBy: { sortOrder: "asc" },
          include: {
            product: {
              select: {
                id: true,
                name: true,
                stockQty: true,
                baseUnitName: true,
                subUnitName: true,
                unitsPerBase: true,
              },
            },
          },
        },
        returns: { select: { status: true } },
      },
    });
    if (!invoice) return fail(m.notFound);
    if (invoice.status === "CANCELLED") return fail(m.cancelled);
    if (invoice.returns.some((entry) => entry.status === "CONFIRMED"))
      return fail(m.hasReturns);

    const [customers, cashboxes] = await prisma.$transaction([
      prisma.customer.findMany({
        where: { isActive: true },
        orderBy: { name: "asc" },
        select: { id: true, name: true },
      }),
      prisma.cashbox.findMany({
        where: { isActive: true },
        orderBy: { sortOrder: "asc" },
        select: { id: true, name: true },
      }),
    ]);

    // One entry per product — a product on two lines contributes both quantities.
    const heldPerProduct = new Map<string, Prisma.Decimal>();
    for (const line of invoice.lines) {
      const held = heldPerProduct.get(line.productId);
      heldPerProduct.set(
        line.productId,
        held ? held.plus(line.qtyInSub) : line.qtyInSub,
      );
    }

    return ok({
      options: { customers, cashboxes },
      sale: {
        id: invoice.id,
        number: invoice.number,
        updatedAt: invoice.updatedAt.toISOString(),
        customerId: invoice.customerId,
        cashboxId: invoice.cashboxId,
        discountAmount: invoice.discountAmount.toString(),
        paidAmount: invoice.paidAmount.toString(),
        lines: invoice.lines.map((line, index) => ({
          lineId: `line-${index + 1}`,
          productId: line.productId,
          productName: line.productName,
          unitType: line.unitType,
          baseUnitName: line.product.baseUnitName,
          subUnitName: line.product.subUnitName,
          unitsPerBase: line.unitsPerBaseSnapshot.toNumber(),
          qty: line.qtyInUnit.toNumber(),
          unitPrice: line.unitPrice.toNumber(),
          lineTotal: line.lineTotal.toNumber(),
        })),
        stock: [...heldPerProduct].flatMap(([productId, held]) => {
          // Always present: the map was built from these very lines.
          const line = invoice.lines.find((entry) => entry.productId === productId);
          if (!line) return [];
          return [
            {
              productId,
              stockQty: line.product.stockQty.plus(held).toString(),
              productName: line.product.name,
              subUnitName: line.product.subUnitName,
            },
          ];
        }),
      },
    });
  } catch (error) {
    return actionError(error);
  }
}

/** Real invoice data for the shared print-preview route (A4 / A5 / 80 mm). */
export async function getSalePrintData(
  input: unknown,
): Promise<ActionResult<PrintInvoiceData>> {
  try {
    await requirePermission("sale.print");
    const parsed = saleIdSchema.safeParse(input);
    if (!parsed.success) return fail(m.invalid);

    const [invoice, settings] = await prisma.$transaction([
      prisma.invoice.findFirst({
        where: { id: parsed.data, type: "SALE" },
        include: {
          customer: { select: { name: true, phone: true, address: true, balance: true } },
          createdBy: { select: { displayName: true } },
          lines: {
            where: { isCurrent: true },
            orderBy: { sortOrder: "asc" },
            include: { product: { select: { sku: true } } },
          },
        },
      }),
      prisma.setting.findMany({
        where: {
          key: {
            in: [
              "shop.name",
              "shop.phone",
              "shop.phone2",
              "shop.address",
              "shop.invoiceFooter",
              "shop.taxNote",
            ],
          },
        },
      }),
    ]);
    if (!invoice) return fail(m.notFound);

    const setting = (key: string): string | undefined => {
      const value = settings.find((entry) => entry.key === key)?.value;
      return typeof value === "string" && value ? value : undefined;
    };

    // The party's balance already includes this invoice's unpaid remainder, so the
    // "previous balance" line is that balance minus what this invoice added.
    const currentBalance = invoice.customer?.balance ?? null;
    const previousBalance = currentBalance?.minus(invoice.remainingAmount) ?? null;

    return ok({
      shop: {
        name: setting("shop.name") ?? messages.app.name,
        phone: setting("shop.phone") ?? "",
        phone2: setting("shop.phone2"),
        address: setting("shop.address") ?? "",
        taxNote: setting("shop.taxNote"),
        invoiceFooter: setting("shop.invoiceFooter"),
      },
      documentTypeLabel: messages.invoices.print.documentTypeSale,
      number: invoice.number,
      issuedAt: invoice.issuedAt.toISOString(),
      issuedTime: formatShopTime(invoice.issuedAt),
      cashierName: invoice.createdBy.displayName,
      partyLabel: messages.invoices.party.SALE,
      partyName: invoice.customer?.name ?? messages.invoices.list.walkInCustomer,
      partyPhone: invoice.customer?.phone ?? undefined,
      partyAddress: invoice.customer?.address ?? undefined,
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
      previousBalance: previousBalance?.toString(),
      currentBalance: currentBalance?.toString(),
    });
  } catch (error) {
    return actionError(error);
  }
}
