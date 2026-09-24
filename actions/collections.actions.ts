"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { AuthRequiredError, PermissionDeniedError, requirePermission } from "@/lib/auth-guard";
import { writeAudit } from "@/lib/audit";
import { fail, ok } from "@/lib/action-result";
import { logError } from "@/lib/logger";
import { nextDocumentNumber } from "@/lib/numbering";
import { prisma } from "@/lib/prisma";
import { syncNotifications } from "@/lib/notifications";
import { createCollectionSchema, partyIdSchema, updateCollectionSchema } from "@/lib/validations";
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
  logError("Collection action failed", error);
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
      partyId: collection.customerId,
      partyName: collection.customer.name,
      cashboxId: collection.cashboxId,
      cashboxName: collection.cashbox.name,
      amount: collection.amount.toString(),
      note: collection.note ?? undefined,
      status: collection.status,
      occurredAt: collection.occurredAt.toISOString(),
    })));
  } catch (error) {
    return actionError(error);
  }
}

export async function getCollectionById(id: string): Promise<ActionResult<MoneyDocumentRow>> {
  try {
    await requirePermission("collection.view");
    const parsedId = partyIdSchema.safeParse(id);
    if (!parsedId.success) return fail(m.notFound);
    const collection = await prisma.collection.findUnique({
      where: { id: parsedId.data },
      include: { customer: { select: { name: true } }, cashbox: { select: { name: true } } },
    });
    if (!collection) return fail(m.notFound);
    return ok({
      id: collection.id,
      number: collection.number,
      partyId: collection.customerId,
      partyName: collection.customer.name,
      cashboxId: collection.cashboxId,
      cashboxName: collection.cashbox.name,
      amount: collection.amount.toString(),
      note: collection.note ?? undefined,
      status: collection.status,
      occurredAt: collection.occurredAt.toISOString(),
    });
  } catch (error) {
    return actionError(error);
  }
}

export async function getCollectionFormOptions(includePartyId?: string): Promise<ActionResult<{ parties: PartyWithBalanceOption[]; cashboxes: EntityComboboxOption[] }>> {
  try {
    await requirePermission("collection.create");
    const [customers, cashboxes] = await Promise.all([
      prisma.customer.findMany({
        where: { isActive: true, OR: [{ balance: { gt: 0 } }, ...(includePartyId ? [{ id: includePartyId }] : [])] },
        orderBy: { name: "asc" },
      }),
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
      await syncNotifications(tx, { customerIds: [customerId] });
      await writeAudit(tx, {
        userId: user.id, action: "collection.create", entityType: "Collection",
        entityId: collection.id, entityLabel: `#${String(number).padStart(6, "0")}`,
        after: { customerId, cashboxId, amount: amount.toString() },
      });
      return { id: collection.id, number };
    }, { timeout: 20_000 });
    revalidatePath("/collections");
    revalidatePath("/cashboxes");
    revalidatePath(`/customers/${customerId}`);
    return ok(created);
  } catch (error) {
    return actionError(error);
  }
}

/**
 * Reverses a confirmed collection's cash and customer-balance effect inside the caller's
 * transaction, without touching the Collection row itself — shared by update (reverse, then
 * reapply with new values) and delete (reverse, then remove the row).
 */
async function reverseCollectionEffect(
  tx: Prisma.TransactionClient,
  collection: { id: string; customerId: string; cashboxId: string; amount: Prisma.Decimal; number: number },
  userId: string,
  note: string | undefined,
) {
  const occurredAt = new Date();
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
    refType: "COLLECTION", refId: collection.id, note, createdById: userId, createdAt: occurredAt,
  } });
  await tx.partyTransaction.create({ data: {
    partyType: "CUSTOMER", customerId: collection.customerId, type: "PAYMENT",
    debit: collection.amount, credit: new Prisma.Decimal(0), balanceAfter: updatedCustomer.balance,
    refType: "COLLECTION", refId: collection.id, note, occurredAt, createdById: userId,
  } });
}

export async function updateCollection(input: unknown): Promise<ActionResult<{ id: string; number: number }>> {
  try {
    const user = await requirePermission("collection.create");
    const parsed = updateCollectionSchema.safeParse(input);
    if (!parsed.success) return fail(m.invalid, parsed.error.flatten().fieldErrors);
    const { id, customerId, cashboxId, note } = parsed.data;
    const amount = new Prisma.Decimal(parsed.data.amount);

    const updated = await prisma.$transaction(async (tx) => {
      const existing = await tx.collection.findUnique({ where: { id } });
      if (!existing) throw new CollectionDomainError("notFound");
      if (existing.status !== "CONFIRMED") throw new CollectionDomainError("cancelled");

      const [customer, cashbox] = await Promise.all([
        tx.customer.findUnique({ where: { id: customerId } }),
        tx.cashbox.findUnique({ where: { id: cashboxId } }),
      ]);
      if (!customer || !cashbox) throw new CollectionDomainError("notFound");
      if (!customer.isActive || !cashbox.isActive) throw new CollectionDomainError("inactive");

      await reverseCollectionEffect(tx, existing, user.id, "تعديل تحصيل");

      const reappliedCustomerUpdate = await tx.customer.updateMany({
        where: { id: customerId, balance: { gte: amount } }, data: { balance: { decrement: amount } },
      });
      if (reappliedCustomerUpdate.count !== 1) throw new CollectionDomainError("exceedsBalance");
      const finalCustomer = await tx.customer.findUniqueOrThrow({ where: { id: customerId } });
      const finalCashbox = await tx.cashbox.update({ where: { id: cashboxId }, data: { balance: { increment: amount } } });

      const occurredAt = new Date();
      await tx.collection.update({
        where: { id }, data: { customerId, cashboxId, amount, note, occurredAt },
      });
      await tx.cashMovement.create({ data: {
        cashboxId, type: "CUSTOMER_COLLECTION", amount, balanceAfter: finalCashbox.balance,
        customerId, refType: "COLLECTION", refId: id, note, createdById: user.id, createdAt: occurredAt,
      } });
      await tx.partyTransaction.create({ data: {
        partyType: "CUSTOMER", customerId, type: "PAYMENT", debit: new Prisma.Decimal(0), credit: amount,
        balanceAfter: finalCustomer.balance, refType: "COLLECTION", refId: id,
        note, occurredAt, createdById: user.id,
      } });

      await syncNotifications(tx, { customerIds: [existing.customerId, customerId] });
      await writeAudit(tx, {
        userId: user.id, action: "collection.update", entityType: "Collection",
        entityId: id, entityLabel: `#${String(existing.number).padStart(6, "0")}`,
        before: { customerId: existing.customerId, cashboxId: existing.cashboxId, amount: existing.amount.toString() },
        after: { customerId, cashboxId, amount: amount.toString() },
      });
      return { id, number: existing.number };
    }, { timeout: 20_000 });

    revalidatePath("/collections");
    revalidatePath("/cashboxes");
    revalidatePath(`/customers/${customerId}`);
    return ok(updated);
  } catch (error) {
    return actionError(error);
  }
}

export async function deleteCollection(id: unknown): Promise<ActionResult<{ number: number }>> {
  try {
    const user = await requirePermission("collection.cancel");
    const parsedId = partyIdSchema.safeParse(id);
    if (!parsedId.success) return fail(m.invalid);

    const deleted = await prisma.$transaction(async (tx) => {
      const collection = await tx.collection.findUnique({ where: { id: parsedId.data } });
      if (!collection) throw new CollectionDomainError("notFound");
      if (collection.status !== "CONFIRMED") throw new CollectionDomainError("cancelled");

      await reverseCollectionEffect(tx, collection, user.id, "حذف تحصيل");

      await writeAudit(tx, {
        userId: user.id, action: "collection.delete", entityType: "Collection",
        entityId: collection.id, entityLabel: `#${String(collection.number).padStart(6, "0")}`,
        before: { status: collection.status, amount: collection.amount.toString() },
        after: undefined,
      });

      await tx.collection.delete({ where: { id: parsedId.data } });

      await syncNotifications(tx, { customerIds: [collection.customerId] });

      return { number: collection.number };
    }, { timeout: 20_000 });

    revalidatePath("/collections");
    revalidatePath("/cashboxes");
    return ok(deleted);
  } catch (error) {
    return actionError(error);
  }
}
