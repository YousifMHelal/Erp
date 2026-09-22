"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { AuthRequiredError, PermissionDeniedError, requirePermission } from "@/lib/auth-guard";
import { writeAudit } from "@/lib/audit";
import { fail, ok } from "@/lib/action-result";
import { prisma } from "@/lib/prisma";
import { buildPartyStatement } from "@/lib/party-statement";
import { createPartySchema, partyIdSchema, updatePartySchema } from "@/lib/validations";
import messages from "@/messages/ar.json";
import type { ActionResult, PartyDetailData, PartyRecord, PartyStatementEntry } from "@/types";

const m = messages.partyAction;

function actionError<T>(error: unknown): ActionResult<T> {
  if (error instanceof AuthRequiredError) return fail(m.unauthorized);
  if (error instanceof PermissionDeniedError) return fail(m.forbidden);
  console.error("Supplier action failed", error);
  return fail(m.failed);
}

function toRecord(supplier: Prisma.SupplierGetPayload<object>): PartyRecord {
  return {
    id: supplier.id,
    name: supplier.name,
    phone: supplier.phone ?? undefined,
    address: supplier.address ?? undefined,
    openingBalance: supplier.openingBalance.toString(),
    balance: supplier.balance.toString(),
    notes: supplier.notes ?? undefined,
    isActive: supplier.isActive,
  };
}

export async function getSuppliers(): Promise<ActionResult<PartyRecord[]>> {
  try {
    await requirePermission("supplier.view");
    const suppliers = await prisma.supplier.findMany({ orderBy: { name: "asc" } });
    return ok(suppliers.map(toRecord));
  } catch (error) {
    return actionError(error);
  }
}

export async function getSupplierDetail(id: string): Promise<ActionResult<PartyDetailData>> {
  try {
    await requirePermission("supplier.view");
    const parsedId = partyIdSchema.safeParse(id);
    if (!parsedId.success) return fail(m.invalid);
    const supplierId = parsedId.data;
    const [supplier, invoices, payments, transactions] = await Promise.all([
      prisma.supplier.findUnique({ where: { id: supplierId } }),
      prisma.invoice.findMany({ where: { supplierId, type: "PURCHASE" }, orderBy: { issuedAt: "desc" } }),
      prisma.payment.findMany({ where: { supplierId }, include: { cashbox: true }, orderBy: { occurredAt: "desc" } }),
      prisma.partyTransaction.findMany({
        where: { supplierId }, include: { invoice: { select: { number: true } } },
        orderBy: [{ occurredAt: "asc" }, { createdAt: "asc" }, { id: "asc" }],
      }),
    ]);
    if (!supplier) return fail(m.notFound);
    const paymentNumbers = new Map(payments.map((payment) => [payment.id, payment.number]));
    const entries: PartyStatementEntry[] = transactions.map((transaction) => ({
      id: transaction.id,
      date: transaction.occurredAt.toISOString(),
      type: transaction.type,
      debit: transaction.debit.toString(),
      credit: transaction.credit.toString(),
      invoiceNumber: transaction.invoice?.number,
      referenceNumber: transaction.refType === "PAYMENT" ? paymentNumbers.get(transaction.refId) : undefined,
      referenceType: transaction.refType === "PAYMENT" ? "PAYMENT" : undefined,
    }));
    const totalInvoiced = invoices.reduce(
      (total, invoice) => invoice.status === "CONFIRMED" ? total.plus(invoice.total) : total,
      new Prisma.Decimal(0),
    );
    return ok({
      party: {
        ...toRecord(supplier),
        totalInvoiced: totalInvoiced.toString(),
        createdAt: supplier.createdAt.toISOString(),
      },
      invoices: invoices.map((invoice) => ({
        id: invoice.id, number: invoice.number, total: invoice.total.toString(),
        paymentStatus: invoice.paymentStatus, status: invoice.status,
        issuedAt: invoice.issuedAt.toISOString(),
      })),
      payments: payments.filter((payment) => payment.status === "CONFIRMED").map((payment) => ({
        id: payment.id, number: payment.number, amount: payment.amount.toString(),
        cashboxName: payment.cashbox.name, occurredAt: payment.occurredAt.toISOString(),
      })),
      statement: buildPartyStatement(entries),
    });
  } catch (error) {
    return actionError(error);
  }
}

export async function createSupplier(input: unknown): Promise<ActionResult<PartyRecord>> {
  try {
    const user = await requirePermission("supplier.create");
    const parsed = createPartySchema.safeParse(input);
    if (!parsed.success) return fail(m.invalid, parsed.error.flatten().fieldErrors);
    const data = parsed.data;
    const opening = new Prisma.Decimal(data.openingBalance);
    const supplier = await prisma.$transaction(async (tx) => {
      const created = await tx.supplier.create({
        data: {
          name: data.name,
          phone: data.phone || null,
          address: data.address || null,
          notes: data.notes || null,
          openingBalance: opening,
          balance: opening,
        },
      });
      if (!opening.isZero()) {
        await tx.partyTransaction.create({
          data: {
            partyType: "SUPPLIER", supplierId: created.id, type: "OPENING",
            debit: opening, credit: new Prisma.Decimal(0), balanceAfter: opening,
            refType: "OPENING", refId: created.id, createdById: user.id,
          },
        });
      }
      await writeAudit(tx, {
        userId: user.id, action: "supplier.create", entityType: "Supplier",
        entityId: created.id, entityLabel: created.name,
        after: { name: created.name, phone: created.phone, openingBalance: opening.toString() },
      });
      return created;
    });
    revalidatePath("/suppliers");
    return ok(toRecord(supplier));
  } catch (error) {
    return actionError(error);
  }
}

export async function updateSupplier(id: string, input: unknown): Promise<ActionResult<PartyRecord>> {
  try {
    const user = await requirePermission("supplier.edit");
    const parsedId = partyIdSchema.safeParse(id);
    const parsed = updatePartySchema.safeParse(input);
    if (!parsedId.success || !parsed.success) return fail(m.invalid, parsed.success ? undefined : parsed.error.flatten().fieldErrors);
    const data = parsed.data;
    const result = await prisma.$transaction(async (tx) => {
      const before = await tx.supplier.findUnique({ where: { id: parsedId.data } });
      if (!before) return null;
      const after = await tx.supplier.update({
        where: { id: before.id },
        data: { name: data.name, phone: data.phone || null, address: data.address || null, notes: data.notes || null },
      });
      await writeAudit(tx, {
        userId: user.id, action: "supplier.edit", entityType: "Supplier",
        entityId: after.id, entityLabel: after.name,
        before: { name: before.name, phone: before.phone, address: before.address, notes: before.notes },
        after: { name: after.name, phone: after.phone, address: after.address, notes: after.notes },
      });
      return after;
    });
    if (!result) return fail(m.notFound);
    revalidatePath("/suppliers");
    revalidatePath(`/suppliers/${id}`);
    return ok(toRecord(result));
  } catch (error) {
    return actionError(error);
  }
}

export async function archiveSupplier(id: string): Promise<ActionResult<{ id: string }>> {
  try {
    const user = await requirePermission("supplier.edit");
    const parsedId = partyIdSchema.safeParse(id);
    if (!parsedId.success) return fail(m.invalid);
    const result = await prisma.$transaction(async (tx) => {
      const supplier = await tx.supplier.findUnique({ where: { id: parsedId.data } });
      if (!supplier) return "notFound";
      if (!supplier.balance.isZero()) return "hasBalance";
      if (!supplier.isActive) return "inactive";
      await tx.supplier.update({ where: { id: supplier.id }, data: { isActive: false } });
      await writeAudit(tx, {
        userId: user.id, action: "supplier.archive", entityType: "Supplier",
        entityId: supplier.id, entityLabel: supplier.name,
        before: { isActive: true }, after: { isActive: false },
      });
      return supplier.id;
    });
    if (result === "notFound" || result === "hasBalance" || result === "inactive") return fail(m[result]);
    revalidatePath("/suppliers");
    revalidatePath(`/suppliers/${id}`);
    return ok({ id: result });
  } catch (error) {
    return actionError(error);
  }
}


