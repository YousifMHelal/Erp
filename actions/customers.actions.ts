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
  console.error("Customer action failed", error);
  return fail(m.failed);
}

function toRecord(customer: Prisma.CustomerGetPayload<object>): PartyRecord {
  return {
    id: customer.id,
    name: customer.name,
    phone: customer.phone ?? undefined,
    address: customer.address ?? undefined,
    openingBalance: customer.openingBalance.toString(),
    balance: customer.balance.toString(),
    notes: customer.notes ?? undefined,
    isActive: customer.isActive,
  };
}

export async function getCustomers(): Promise<ActionResult<PartyRecord[]>> {
  try {
    await requirePermission("customer.view");
    const customers = await prisma.customer.findMany({ orderBy: { name: "asc" } });
    return ok(customers.map(toRecord));
  } catch (error) {
    return actionError(error);
  }
}

export async function getCustomerDetail(id: string): Promise<ActionResult<PartyDetailData>> {
  try {
    await requirePermission("customer.view");
    const parsedId = partyIdSchema.safeParse(id);
    if (!parsedId.success) return fail(m.invalid);
    const customerId = parsedId.data;
    const [customer, invoices, collections, transactions] = await Promise.all([
      prisma.customer.findUnique({ where: { id: customerId } }),
      prisma.invoice.findMany({ where: { customerId, type: "SALE" }, orderBy: { issuedAt: "desc" } }),
      prisma.collection.findMany({ where: { customerId }, include: { cashbox: true }, orderBy: { occurredAt: "desc" } }),
      prisma.partyTransaction.findMany({
        where: { customerId }, include: { invoice: { select: { number: true } } },
        orderBy: [{ occurredAt: "asc" }, { createdAt: "asc" }, { id: "asc" }],
      }),
    ]);
    if (!customer) return fail(m.notFound);
    const collectionNumbers = new Map(collections.map((collection) => [collection.id, collection.number]));
    const entries: PartyStatementEntry[] = transactions.map((transaction) => ({
      id: transaction.id,
      date: transaction.occurredAt.toISOString(),
      type: transaction.type,
      debit: transaction.debit.toString(),
      credit: transaction.credit.toString(),
      invoiceNumber: transaction.invoice?.number,
      referenceNumber: transaction.refType === "COLLECTION" ? collectionNumbers.get(transaction.refId) : undefined,
      referenceType: transaction.refType === "COLLECTION" ? "COLLECTION" : undefined,
    }));
    const totalInvoiced = invoices.reduce(
      (total, invoice) => invoice.status === "CONFIRMED" ? total.plus(invoice.total) : total,
      new Prisma.Decimal(0),
    );
    return ok({
      party: {
        ...toRecord(customer),
        totalInvoiced: totalInvoiced.toString(),
        createdAt: customer.createdAt.toISOString(),
      },
      invoices: invoices.map((invoice) => ({
        id: invoice.id, number: invoice.number, total: invoice.total.toString(),
        paymentStatus: invoice.paymentStatus, status: invoice.status,
        issuedAt: invoice.issuedAt.toISOString(),
      })),
      payments: collections.filter((collection) => collection.status === "CONFIRMED").map((collection) => ({
        id: collection.id, number: collection.number, amount: collection.amount.toString(),
        cashboxName: collection.cashbox.name, occurredAt: collection.occurredAt.toISOString(),
      })),
      statement: buildPartyStatement(entries),
    });
  } catch (error) {
    return actionError(error);
  }
}

export async function createCustomer(input: unknown): Promise<ActionResult<PartyRecord>> {
  try {
    const user = await requirePermission("customer.create");
    const parsed = createPartySchema.safeParse(input);
    if (!parsed.success) return fail(m.invalid, parsed.error.flatten().fieldErrors);
    const data = parsed.data;
    const opening = new Prisma.Decimal(data.openingBalance);
    const customer = await prisma.$transaction(async (tx) => {
      const created = await tx.customer.create({
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
            partyType: "CUSTOMER", customerId: created.id, type: "OPENING",
            debit: opening, credit: new Prisma.Decimal(0), balanceAfter: opening,
            refType: "OPENING", refId: created.id, createdById: user.id,
          },
        });
      }
      await writeAudit(tx, {
        userId: user.id, action: "customer.create", entityType: "Customer",
        entityId: created.id, entityLabel: created.name,
        after: { name: created.name, phone: created.phone, openingBalance: opening.toString() },
      });
      return created;
    });
    revalidatePath("/customers");
    return ok(toRecord(customer));
  } catch (error) {
    return actionError(error);
  }
}

export async function updateCustomer(id: string, input: unknown): Promise<ActionResult<PartyRecord>> {
  try {
    const user = await requirePermission("customer.edit");
    const parsedId = partyIdSchema.safeParse(id);
    const parsed = updatePartySchema.safeParse(input);
    if (!parsedId.success || !parsed.success) return fail(m.invalid, parsed.success ? undefined : parsed.error.flatten().fieldErrors);
    const data = parsed.data;
    const result = await prisma.$transaction(async (tx) => {
      const before = await tx.customer.findUnique({ where: { id: parsedId.data } });
      if (!before) return null;
      const after = await tx.customer.update({
        where: { id: before.id },
        data: { name: data.name, phone: data.phone || null, address: data.address || null, notes: data.notes || null },
      });
      await writeAudit(tx, {
        userId: user.id, action: "customer.edit", entityType: "Customer",
        entityId: after.id, entityLabel: after.name,
        before: { name: before.name, phone: before.phone, address: before.address, notes: before.notes },
        after: { name: after.name, phone: after.phone, address: after.address, notes: after.notes },
      });
      return after;
    });
    if (!result) return fail(m.notFound);
    revalidatePath("/customers");
    revalidatePath(`/customers/${id}`);
    return ok(toRecord(result));
  } catch (error) {
    return actionError(error);
  }
}

export async function archiveCustomer(id: string): Promise<ActionResult<{ id: string }>> {
  try {
    const user = await requirePermission("customer.edit");
    const parsedId = partyIdSchema.safeParse(id);
    if (!parsedId.success) return fail(m.invalid);
    const result = await prisma.$transaction(async (tx) => {
      const customer = await tx.customer.findUnique({ where: { id: parsedId.data } });
      if (!customer) return "notFound";
      if (!customer.balance.isZero()) return "hasBalance";
      if (!customer.isActive) return "inactive";
      await tx.customer.update({ where: { id: customer.id }, data: { isActive: false } });
      await writeAudit(tx, {
        userId: user.id, action: "customer.archive", entityType: "Customer",
        entityId: customer.id, entityLabel: customer.name,
        before: { isActive: true }, after: { isActive: false },
      });
      return customer.id;
    });
    if (result === "notFound" || result === "hasBalance" || result === "inactive") return fail(m[result]);
    revalidatePath("/customers");
    revalidatePath(`/customers/${id}`);
    return ok({ id: result });
  } catch (error) {
    return actionError(error);
  }
}
