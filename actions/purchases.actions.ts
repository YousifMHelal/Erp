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
import { logError } from "@/lib/logger";
import { shopDayEnd, shopDayStart } from "@/lib/format";
import { nextDocumentNumber } from "@/lib/numbering";
import { prisma } from "@/lib/prisma";
import {
  postPurchase,
  preparePurchase,
  reversePurchase,
  PurchaseDomainError,
} from "@/lib/purchase-ledger";
import {
  cancelPurchaseSchema,
  createPurchaseSchema,
  productSearchSchema,
  purchaseIdSchema,
  purchasesFilterSchema,
  updatePurchaseSchema,
} from "@/lib/validations";
import messages from "@/messages/ar.json";
import type {
  ActionResult,
  PrintInvoiceData,
  PurchaseDetail,
  PurchaseEditData,
  PurchaseFormOptions,
  PurchaseListFilterOptions,
  PurchaseListRow,
  PurchasesPage,
  SaleProductOption,
} from "@/types";

const m = messages.purchasesAction;
const txOptions = {
  isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
  timeout: 20_000,
};

async function purchaseTransaction<T>(
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
  throw new PurchaseDomainError("conflict");
}

function actionError<T>(error: unknown): ActionResult<T> {
  if (error instanceof AuthRequiredError) return fail(m.unauthorized);
  if (error instanceof PermissionDeniedError) return fail(m.forbidden);
  if (error instanceof PurchaseDomainError) return fail(m[error.code]);
  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2034"
  )
    return fail(m.conflict);
  logError("Purchase action failed", error);
  return fail(m.failed);
}

export async function createPurchase(
  input: unknown,
): Promise<ActionResult<{ id: string; number: number }>> {
  try {
    const user = await requirePermission("purchase.create");
    const parsed = createPurchaseSchema.safeParse(input);
    if (!parsed.success)
      return fail(m.invalid, parsed.error.flatten().fieldErrors);
    const invoice = await purchaseTransaction(async (tx) => {
      const purchase = await preparePurchase(tx, parsed.data);
      const number = await nextDocumentNumber(tx, "PURCHASE");
      const created = await tx.invoice.create({
        data: {
          number,
          type: "PURCHASE",
          paymentStatus: purchase.paymentStatus,
          supplierId: parsed.data.supplierId,
          cashboxId: parsed.data.cashboxId,
          subtotal: purchase.subtotal,
          discountAmount: purchase.discountAmount,
          total: purchase.total,
          paidAmount: purchase.paidAmount,
          remainingAmount: purchase.remainingAmount,
          notes: parsed.data.notes,
          issuedAt: parsed.data.issuedAt
            ? shopDayStart(parsed.data.issuedAt)
            : new Date(),
          createdById: user.id,
          lines: { createMany: { data: purchase.lines } },
        },
      });
      await postPurchase(tx, {
        invoiceId: created.id,
        cashboxId: created.cashboxId,
        supplierId: created.supplierId,
        purchase,
        userId: user.id,
      });
      await writeAudit(tx, {
        userId: user.id,
        action: "purchase.create",
        entityType: "Invoice",
        entityId: created.id,
        entityLabel: `#${String(number).padStart(6, "0")}`,
        after: {
          number,
          total: purchase.total,
          paidAmount: purchase.paidAmount,
          remainingAmount: purchase.remainingAmount,
          lines: purchase.lines,
        },
      });
      return { id: created.id, number };
    });
    revalidatePath("/purchases");
    revalidatePath("/inventory");
    return ok(invoice);
  } catch (error) {
    return actionError(error);
  }
}

export async function updatePurchase(
  input: unknown,
): Promise<ActionResult<{ id: string; number: number }>> {
  try {
    const user = await requirePermission("purchase.edit");
    const parsed = updatePurchaseSchema.safeParse(input);
    if (!parsed.success)
      return fail(m.invalid, parsed.error.flatten().fieldErrors);
    const updated = await purchaseTransaction(async (tx) => {
      const old = await tx.invoice.findFirst({
        where: { id: parsed.data.id, type: "PURCHASE" },
        include: { lines: true, returns: true },
      });
      if (!old) throw new PurchaseDomainError("notFound");
      if (old.status === "CANCELLED") throw new PurchaseDomainError("cancelled");
      if (old.returns.some((entry) => entry.status === "CONFIRMED"))
        throw new PurchaseDomainError("hasReturns");
      if (old.updatedAt.getTime() !== parsed.data.updatedAt.getTime())
        throw new PurchaseDomainError("conflict");
      const purchase = await preparePurchase(tx, parsed.data);
      const changed = await tx.invoice.updateMany({
        where: { id: old.id, status: "CONFIRMED", updatedAt: old.updatedAt },
        data: {
          supplierId: parsed.data.supplierId,
          cashboxId: parsed.data.cashboxId,
          subtotal: purchase.subtotal,
          discountAmount: purchase.discountAmount,
          total: purchase.total,
          paidAmount: purchase.paidAmount,
          remainingAmount: purchase.remainingAmount,
          paymentStatus: purchase.paymentStatus,
          notes: parsed.data.notes,
          issuedAt: parsed.data.issuedAt
            ? shopDayStart(parsed.data.issuedAt)
            : old.issuedAt,
        },
      });
      if (changed.count !== 1) throw new PurchaseDomainError("conflict");
      await reversePurchase(tx, old, user.id, "purchase.edit");
      await tx.invoiceLine.updateMany({
        where: { invoiceId: old.id, isCurrent: true },
        data: { isCurrent: false },
      });
      await tx.invoiceLine.createMany({
        data: purchase.lines.map((line) => ({ ...line, invoiceId: old.id })),
      });
      await postPurchase(tx, {
        invoiceId: old.id,
        cashboxId: parsed.data.cashboxId,
        supplierId: parsed.data.supplierId,
        purchase,
        userId: user.id,
      });
      await writeAudit(tx, {
        userId: user.id,
        action: "purchase.edit",
        entityType: "Invoice",
        entityId: old.id,
        entityLabel: `#${String(old.number).padStart(6, "0")}`,
        before: {
          supplierId: old.supplierId,
          cashboxId: old.cashboxId,
          total: old.total,
          paidAmount: old.paidAmount,
          lines: old.lines.filter((line) => line.isCurrent),
        },
        after: {
          supplierId: parsed.data.supplierId,
          cashboxId: parsed.data.cashboxId,
          total: purchase.total,
          paidAmount: purchase.paidAmount,
          lines: purchase.lines,
        },
      });
      return { id: old.id, number: old.number };
    });
    revalidatePath("/purchases");
    revalidatePath(`/purchases/${updated.id}`);
    revalidatePath("/inventory");
    return ok(updated);
  } catch (error) {
    return actionError(error);
  }
}

export async function cancelPurchase(
  input: unknown,
): Promise<ActionResult<{ id: string; number: number }>> {
  try {
    const user = await requirePermission("purchase.cancel");
    const parsed = cancelPurchaseSchema.safeParse(input);
    if (!parsed.success)
      return fail(m.invalid, parsed.error.flatten().fieldErrors);
    const cancelled = await purchaseTransaction(async (tx) => {
      const invoice = await tx.invoice.findFirst({
        where: { id: parsed.data.id, type: "PURCHASE" },
        include: { lines: true, returns: true },
      });
      if (!invoice) throw new PurchaseDomainError("notFound");
      if (invoice.status === "CANCELLED")
        throw new PurchaseDomainError("cancelled");
      if (invoice.returns.some((entry) => entry.status === "CONFIRMED"))
        throw new PurchaseDomainError("hasReturns");
      const claimed = await tx.invoice.updateMany({
        where: { id: invoice.id, status: "CONFIRMED" },
        data: { status: "CANCELLED", cancelledAt: new Date(), cancelledById: user.id, cancelReason: parsed.data.reason },
      });
      if (claimed.count !== 1) throw new PurchaseDomainError("conflict");
      await reversePurchase(tx, invoice, user.id, parsed.data.reason);
      await writeAudit(tx, {
        userId: user.id,
        action: "purchase.delete",
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
    revalidatePath("/purchases");
    revalidatePath(`/purchases/${cancelled.id}`);
    revalidatePath("/inventory");
    return ok(cancelled);
  } catch (error) {
    return actionError(error);
  }
}

export async function getPurchases(
  input: unknown,
): Promise<ActionResult<PurchasesPage>> {
  try {
    await requirePermission("purchase.view");
    const parsed = purchasesFilterSchema.safeParse(input);
    if (!parsed.success)
      return fail(m.invalid, parsed.error.flatten().fieldErrors);
    const f = parsed.data;
    const parsedNumber =
      f.q && /^#?\d+$/.test(f.q) ? Number(f.q.replace("#", "")) : null;
    const number = parsedNumber !== null && Number.isSafeInteger(parsedNumber) && parsedNumber <= 2_147_483_647
      ? parsedNumber : null;
    const where: Prisma.InvoiceWhereInput = {
      type: "PURCHASE",
      supplierId: f.supplierId,
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
            { supplier: { name: { contains: f.q, mode: "insensitive" } } },
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
          supplier: { select: { name: true } },
          cashbox: { select: { name: true } },
          createdBy: { select: { displayName: true } },
        },
      }),
    ]);
    const rows: PurchaseListRow[] = invoices.map((invoice) => ({
      id: invoice.id,
      number: invoice.number,
      status: invoice.status,
      paymentStatus: invoice.paymentStatus,
      issuedAt: invoice.issuedAt.toISOString(),
      supplierName: invoice.supplier?.name ?? null,
      userName: invoice.createdBy.displayName,
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

export async function getPurchaseById(
  input: unknown,
): Promise<ActionResult<PurchaseDetail>> {
  try {
    await requirePermission("purchase.view");
    const parsed = purchaseIdSchema.safeParse(input);
    if (!parsed.success) return fail(m.invalid);
    const invoice = await prisma.invoice.findFirst({
      where: { id: parsed.data, type: "PURCHASE" },
      include: {
        supplier: { select: { name: true, phone: true, balance: true } },
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
      supplierName: invoice.supplier?.name ?? null,
      userName: invoice.createdBy.displayName,
      cashboxName: invoice.cashbox.name,
      total: invoice.total.toString(),
      paidAmount: invoice.paidAmount.toString(),
      remainingAmount: invoice.remainingAmount.toString(),
      supplierId: invoice.supplierId,
      supplierPhone: invoice.supplier?.phone ?? null,
      supplierBalance: invoice.supplier?.balance.toString() ?? null,
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

export async function getPurchaseFormOptions(): Promise<
  ActionResult<PurchaseFormOptions>
> {
  try {
    await requirePermission("purchase.create");
    const [suppliers, cashboxes] = await prisma.$transaction([
      prisma.supplier.findMany({
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
    return ok({ suppliers, cashboxes });
  } catch (error) {
    return actionError(error);
  }
}

/** Product search for the purchase line-add box — priced from purchase price, not sell price. */
export async function searchPurchaseProducts(
  input: unknown,
): Promise<ActionResult<SaleProductOption[]>> {
  try {
    await requirePermission("purchase.create");
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
        pricePerBase: product.purchasePricePerBase.toString(),
        pricePerSub: product.purchasePricePerBase
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

export async function getPurchaseListFilterOptions(): Promise<
  ActionResult<PurchaseListFilterOptions>
> {
  try {
    await requirePermission("purchase.view");
    const [suppliers, cashboxes, users] = await prisma.$transaction([
      prisma.supplier.findMany({
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
      suppliers,
      cashboxes,
      users: users.map((user) => ({ id: user.id, name: user.displayName })),
    });
  } catch (error) {
    return actionError(error);
  }
}

export async function getPurchaseForEdit(
  input: unknown,
): Promise<ActionResult<PurchaseEditData>> {
  try {
    await requirePermission("purchase.edit");
    const parsed = purchaseIdSchema.safeParse(input);
    if (!parsed.success) return fail(m.invalid);

    const invoice = await prisma.invoice.findFirst({
      where: { id: parsed.data, type: "PURCHASE" },
      include: {
        lines: {
          where: { isCurrent: true },
          orderBy: { sortOrder: "asc" },
          include: {
            product: {
              select: {
                id: true,
                name: true,
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

    const [suppliers, cashboxes] = await prisma.$transaction([
      prisma.supplier.findMany({
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

    return ok({
      options: { suppliers, cashboxes },
      purchase: {
        id: invoice.id,
        number: invoice.number,
        updatedAt: invoice.updatedAt.toISOString(),
        supplierId: invoice.supplierId,
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
      },
    });
  } catch (error) {
    return actionError(error);
  }
}

/** Real invoice data for the shared print-preview route (A4 / A5 / 80 mm). */
export async function getPurchasePrintData(
  input: unknown,
): Promise<ActionResult<PrintInvoiceData>> {
  try {
    await requirePermission("purchase.print");
    const parsed = purchaseIdSchema.safeParse(input);
    if (!parsed.success) return fail(m.invalid);

    const [invoice, settings] = await prisma.$transaction([
      prisma.invoice.findFirst({
        where: { id: parsed.data, type: "PURCHASE" },
        include: {
          supplier: { select: { name: true, phone: true, address: true, balance: true } },
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

    const currentBalance = invoice.supplier?.balance ?? null;
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
      documentTypeLabel: messages.invoices.print.documentTypePurchase,
      number: invoice.number,
      issuedAt: invoice.issuedAt.toISOString(),
      cashierName: invoice.createdBy.displayName,
      partyLabel: messages.invoices.party.PURCHASE,
      partyName: invoice.supplier?.name ?? messages.invoices.list.walkInCustomer,
      partyPhone: invoice.supplier?.phone ?? undefined,
      partyAddress: invoice.supplier?.address ?? undefined,
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
