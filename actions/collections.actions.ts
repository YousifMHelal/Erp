"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { AuthRequiredError, PermissionDeniedError, requirePermission } from "@/lib/auth-guard";
import { writeAudit } from "@/lib/audit";
import { fail, ok } from "@/lib/action-result";
import { nextDocumentNumber } from "@/lib/numbering";
import { prisma } from "@/lib/prisma";
import { cancelMoneyDocumentSchema, createCollectionSchema } from "@/lib/validations";
import messages from "@/messages/ar.json";
import type { ActionResult, EntityComboboxOption, MoneyDocumentRow, PartyWithBalanceOption } from "@/types";

const m = messages.moneyAction;

class CollectionDomainError extends Error {
  constructor(public readonly code: "notFound" | "inactive" | "exceedsBalance" | "insufficientCash" | "cancelled") { super(code); }
}

function actionError<T>(error: unknown): ActionResult<T> {
  if (error instanceof AuthRequiredError) return fail(m.unauthorized);
  if (error instanceof PermissionDeniedError) return fail(m.forbidden);
  if (error instanceof CollectionDomainError) return fail(m[error.code]);
  console.error("Collection action failed", error);
  return fail(m.failed);
}

export async function getCollections(): Promise<ActionResult<MoneyDocumentRow[]>> {
  try {
    await requirePermission("collection.view");
    const collections = await prisma.collection.findMany({
      include: { customer: { select: { name: true } }, cashbox: { select: { name: true } } },
      orderBy: { occurredAt: "desc" },
    });
    return ok(collections.map((collection) => ({
      id: collection.id,
      number: collection.number,
      partyName: collection.customer.name,
      cashboxName: collection.cashbox.name,
      amount: collection.amount.toString(),
      status: collection.status,
      occurredAt: collection.occurredAt.toISOString(),
    })));
  } catch (error) {
    return actionError(error);
  }
}

export async function getCollectionFormOptions(): Promise<ActionResult<{ parties: PartyWithBalanceOption[]; cashboxes: EntityComboboxOption[] }>> {
  try {
    await requirePermission("collection.create");
    const [customers, cashboxes] = await Promise.all([
      prisma.customer.findMany({ where: { isActive: true, balance: { gt: 0 } }, orderBy: { name: "asc" } }),
      prisma.cashbox.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } }),
    ]);
    return ok({
      parties: customers.map((customer) => ({ value: customer.id, label: customer.name, balance: customer.balance.toString() })),
      cashboxes: cashboxes.map((cashbox) => ({ value: cashbox.id, label: cashbox.name })),
    });
  } catch (error) {
    return actionError(error);
  }
}

export async function createCollection(input: unknown): Promise<ActionResult<{ id: string; number: number }>> {
  try {
    const user = await requirePermission("collection.create");
    const parsed = createCollectionSchema.safeParse(input);
    if (!parsed.success) return fail(m.invalid, parsed.error.flatten().fieldErrors);
    const { customerId, cashboxId, note } = parsed.data;
    const amount = new Prisma.Decimal(parsed.data.amount);
    const created = await prisma.$transaction(async (tx) => {
      const [customer, cashbox] = await Promise.all([
        tx.customer.findUnique({ where: { id: customerId } }),
        tx.cashbox.findUnique({ where: { id: cashboxId } }),
      ]);
      if (!customer || !cashbox) throw new CollectionDomainError("notFound");
      if (!customer.isActive || !cashbox.isActive) throw new CollectionDomainError("inactive");
      const customerUpdate = await tx.customer.updateMany({
        where: { id: customerId, balance: { gte: amount } }, data: { balance: { decrement: amount } },
      });
      if (customerUpdate.count !== 1) throw new CollectionDomainError("exceedsBalance");
      const updatedCustomer = await tx.customer.findUniqueOrThrow({ where: { id: customerId } });
      const updatedCashbox = await tx.cashbox.update({ where: { id: cashboxId }, data: { balance: { increment: amount } } });
      const number = await nextDocumentNumber(tx, "COLLECTION");
      const occurredAt = new Date();
      const collection = await tx.collection.create({
        data: { number, customerId, cashboxId, amount, note, occurredAt, createdById: user.id },
      });
      await tx.cashMovement.create({ data: {
        cashboxId, type: "CUSTOMER_COLLECTION", amount, balanceAfter: updatedCashbox.balance,
        customerId, refType: "COLLECTION", refId: collection.id, note, createdById: user.id, createdAt: occurredAt,
      } });
      await tx.partyTransaction.create({ data: {
        partyType: "CUSTOMER", customerId, type: "PAYMENT", debit: new Prisma.Decimal(0), credit: amount,
        balanceAfter: updatedCustomer.balance, refType: "COLLECTION", refId: collection.id,
        note, occurredAt, createdById: user.id,
      } });
      await writeAudit(tx, {
        userId: user.id, action: "collection.create", entityType: "Collection",
        entityId: collection.id, entityLabel: `#${String(number).padStart(6, "0")}`,
        after: { customerId, cashboxId, amount: amount.toString() },
      });
      return { id: collection.id, number };
    });
    revalidatePath("/collections");
    revalidatePath("/cashboxes");
    revalidatePath(`/customers/${customerId}`);
    return ok(created);
  } catch (error) {
    return actionError(error);
  }
}

export async function cancelCollection(input: unknown): Promise<ActionResult<{ id: string }>> {
  try {
    const user = await requirePermission("collection.cancel");
    const parsed = cancelMoneyDocumentSchema.safeParse(input);
    if (!parsed.success) return fail(m.invalid, parsed.error.flatten().fieldErrors);
    const { id, reason } = parsed.data;
    const customerId = await prisma.$transaction(async (tx) => {
      const collection = await tx.collection.findUnique({ where: { id }, include: { customer: true } });
      if (!collection) throw new CollectionDomainError("notFound");
      if (collection.status === "CANCELLED") throw new CollectionDomainError("cancelled");
      const occurredAt = new Date();
      const cancelUpdate = await tx.collection.updateMany({
        where: { id, status: "CONFIRMED" },
        data: { status: "CANCELLED", cancelledAt: occurredAt, cancelledById: user.id },
      });
      if (cancelUpdate.count !== 1) throw new CollectionDomainError("cancelled");
      const cashboxUpdate = await tx.cashbox.updateMany({
        where: { id: collection.cashboxId, balance: { gte: collection.amount } },
        data: { balance: { decrement: collection.amount } },
      });
      if (cashboxUpdate.count !== 1) throw new CollectionDomainError("insufficientCash");
      const updatedCashbox = await tx.cashbox.findUniqueOrThrow({ where: { id: collection.cashboxId } });
      const updatedCustomer = await tx.customer.update({
        where: { id: collection.customerId }, data: { balance: { increment: collection.amount } },
      });
      await tx.cashMovement.create({ data: {
        cashboxId: collection.cashboxId, type: "CUSTOMER_COLLECTION", amount: collection.amount.negated(),
        balanceAfter: updatedCashbox.balance, customerId: collection.customerId,
        refType: "COLLECTION", refId: id, note: reason, createdById: user.id, createdAt: occurredAt,
      } });
      await tx.partyTransaction.create({ data: {
        partyType: "CUSTOMER", customerId: collection.customerId, type: "PAYMENT",
        debit: collection.amount, credit: new Prisma.Decimal(0), balanceAfter: updatedCustomer.balance,
        refType: "COLLECTION", refId: id, note: reason, occurredAt, createdById: user.id,
      } });
      await writeAudit(tx, {
        userId: user.id, action: "collection.cancel", entityType: "Collection",
        entityId: id, entityLabel: `#${String(collection.number).padStart(6, "0")}`,
        before: { status: "CONFIRMED" }, after: { status: "CANCELLED", reason },
      });
      return collection.customerId;
    });
    revalidatePath("/collections");
    revalidatePath("/cashboxes");
    revalidatePath(`/customers/${customerId}`);
    return ok({ id });
  } catch (error) {
    return actionError(error);
  }
}
