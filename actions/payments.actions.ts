"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { AuthRequiredError, PermissionDeniedError, requirePermission } from "@/lib/auth-guard";
import { writeAudit } from "@/lib/audit";
import { rebuildCashboxRunningBalance, removeDocumentCash, restampDocumentCash } from "@/lib/cash-ledger";
import { isClientRequestIdConflict } from "@/lib/idempotency";
import { rebuildPartyRunningBalance, removeDocumentPartyEntries, restampDocumentPartyEntries } from "@/lib/party-ledger";
import { fail, ok } from "@/lib/action-result";
import { logError } from "@/lib/logger";
import { nextDocumentNumber } from "@/lib/numbering";
import { prisma } from "@/lib/prisma";
import { syncNotifications } from "@/lib/notifications";
import { createPaymentSchema, partyIdSchema, updatePaymentSchema } from "@/lib/validations";
import messages from "@/messages/ar.json";
import type { ActionResult, CashboxWithBalanceOption, MoneyDocumentRow, PartyWithBalanceOption } from "@/types";

const m = messages.moneyAction;

class PaymentDomainError extends Error {
  constructor(public readonly code: "notFound" | "inactive" | "exceedsBalance" | "insufficientCash" | "cancelled") { super(code); }
}

function actionError<T>(error: unknown): ActionResult<T> {
  if (error instanceof AuthRequiredError) return fail(m.unauthorized);
  if (error instanceof PermissionDeniedError) return fail(m.forbidden);
  if (error instanceof PaymentDomainError) return fail(m[error.code]);
  logError("Payment action failed", error);
  return fail(m.failed);
}

export async function getPayments(): Promise<ActionResult<MoneyDocumentRow[]>> {
  try {
    await requirePermission("payment.view");
    const payments = await prisma.payment.findMany({
      include: { supplier: { select: { name: true } }, cashbox: { select: { name: true } } },
      orderBy: { occurredAt: "desc" },
    });
    return ok(payments.map((payment) => ({
      id: payment.id,
      number: payment.number,
      partyId: payment.supplierId,
      partyName: payment.supplier.name,
      cashboxId: payment.cashboxId,
      cashboxName: payment.cashbox.name,
      amount: payment.amount.toString(),
      note: payment.note ?? undefined,
      status: payment.status,
      occurredAt: payment.occurredAt.toISOString(),
    })));
  } catch (error) {
    return actionError(error);
  }
}

export async function getPaymentById(id: string): Promise<ActionResult<MoneyDocumentRow>> {
  try {
    await requirePermission("payment.view");
    const parsedId = partyIdSchema.safeParse(id);
    if (!parsedId.success) return fail(m.notFound);
    const payment = await prisma.payment.findUnique({
      where: { id: parsedId.data },
      include: { supplier: { select: { name: true } }, cashbox: { select: { name: true } } },
    });
    if (!payment) return fail(m.notFound);
    return ok({
      id: payment.id,
      number: payment.number,
      partyId: payment.supplierId,
      partyName: payment.supplier.name,
      cashboxId: payment.cashboxId,
      cashboxName: payment.cashbox.name,
      amount: payment.amount.toString(),
      note: payment.note ?? undefined,
      status: payment.status,
      occurredAt: payment.occurredAt.toISOString(),
    });
  } catch (error) {
    return actionError(error);
  }
}

export async function getPaymentFormOptions(includePartyId?: string): Promise<ActionResult<{ parties: PartyWithBalanceOption[]; cashboxes: CashboxWithBalanceOption[] }>> {
  try {
    await requirePermission("payment.create");
    const [suppliers, cashboxes] = await Promise.all([
      prisma.supplier.findMany({
        where: { isActive: true, OR: [{ balance: { gt: 0 } }, ...(includePartyId ? [{ id: includePartyId }] : [])] },
        orderBy: { name: "asc" },
      }),
      prisma.cashbox.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } }),
    ]);
    return ok({
      parties: suppliers.map((supplier) => ({ value: supplier.id, label: supplier.name, balance: supplier.balance.toString() })),
      cashboxes: cashboxes.map((cashbox) => ({ value: cashbox.id, label: cashbox.name, balance: cashbox.balance.toString() })),
    });
  } catch (error) {
    return actionError(error);
  }
}

export async function createPayment(input: unknown): Promise<ActionResult<{ id: string; number: number }>> {
  try {
    const user = await requirePermission("payment.create");
    const parsed = createPaymentSchema.safeParse(input);
    if (!parsed.success) return fail(m.invalid, parsed.error.flatten().fieldErrors);
    const { supplierId, cashboxId, note, clientRequestId } = parsed.data;
    const amount = new Prisma.Decimal(parsed.data.amount);
    if (clientRequestId) {
      const existing = await prisma.payment.findUnique({ where: { clientRequestId }, select: { id: true, number: true } });
      if (existing) return ok(existing);
    }
    const created = await prisma.$transaction(async (tx) => {
      const [supplier, cashbox] = await Promise.all([
        tx.supplier.findUnique({ where: { id: supplierId } }),
        tx.cashbox.findUnique({ where: { id: cashboxId } }),
      ]);
      if (!supplier || !cashbox) throw new PaymentDomainError("notFound");
      if (!supplier.isActive || !cashbox.isActive) throw new PaymentDomainError("inactive");
      const supplierUpdate = await tx.supplier.updateMany({
        where: { id: supplierId, balance: { gte: amount } }, data: { balance: { decrement: amount } },
      });
      if (supplierUpdate.count !== 1) throw new PaymentDomainError("exceedsBalance");
      const updatedSupplier = await tx.supplier.findUniqueOrThrow({ where: { id: supplierId } });
      // A cashbox may go negative — the form warns before submitting.
      const updatedCashbox = await tx.cashbox.update({ where: { id: cashboxId }, data: { balance: { decrement: amount } } });
      const number = await nextDocumentNumber(tx, "PAYMENT");
      const occurredAt = parsed.data.occurredAt ?? new Date();
      const payment = await tx.payment.create({
        data: { number, supplierId, cashboxId, amount, note, occurredAt, clientRequestId, createdById: user.id },
      });
      await tx.cashMovement.create({ data: {
        cashboxId, type: "SUPPLIER_PAYMENT", amount: amount.negated(), balanceAfter: updatedCashbox.balance,
        supplierId, refType: "PAYMENT", refId: payment.id, note, createdById: user.id, createdAt: occurredAt,
      } });
      await tx.partyTransaction.create({ data: {
        partyType: "SUPPLIER", supplierId, type: "PAYMENT", debit: new Prisma.Decimal(0), credit: amount,
        balanceAfter: updatedSupplier.balance, refType: "PAYMENT", refId: payment.id,
        note, occurredAt, createdById: user.id,
      } });
      if (parsed.data.occurredAt) {
        // Back-dated (offline) entry: later rows' running balances shift.
        await rebuildCashboxRunningBalance(tx, cashboxId);
        await rebuildPartyRunningBalance(tx, { kind: "supplier", id: supplierId });
      }
      await syncNotifications(tx, { supplierIds: [supplierId] });
      await writeAudit(tx, {
        userId: user.id, action: "payment.create", entityType: "Payment",
        entityId: payment.id, entityLabel: `#${String(number).padStart(6, "0")}`,
        after: { supplierId, cashboxId, amount: amount.toString() },
      });
      return { id: payment.id, number };
    }, { timeout: 20_000 });
    revalidatePath("/payments");
    revalidatePath("/cashboxes");
    revalidatePath(`/suppliers/${supplierId}`);
    return ok(created);
  } catch (error) {
    if (isClientRequestIdConflict(error)) {
      const raced = await prisma.payment.findFirst({
        where: { clientRequestId: (input as { clientRequestId?: string }).clientRequestId },
        select: { id: true, number: true },
      });
      if (raced) return ok(raced);
    }
    return actionError(error);
  }
}

/**
 * Reverses a confirmed payment's cash and supplier-balance effect inside the caller's
 * transaction, without touching the Payment row itself — shared by update (reverse, then
 * reapply with new values) and delete (reverse, then remove the row).
 */
async function reversePaymentEffect(
  tx: Prisma.TransactionClient,
  payment: { id: string },
) {
  const removedCash = await removeDocumentCash(tx, { refType: "PAYMENT", refId: payment.id });
  const removedParty = await removeDocumentPartyEntries(tx, { refType: "PAYMENT", refId: payment.id });
  return { removedCash, removedParty };
}

export async function updatePayment(input: unknown): Promise<ActionResult<{ id: string; number: number }>> {
  try {
    const user = await requirePermission("payment.create");
    const parsed = updatePaymentSchema.safeParse(input);
    if (!parsed.success) return fail(m.invalid, parsed.error.flatten().fieldErrors);
    const { id, supplierId, cashboxId, note } = parsed.data;
    const amount = new Prisma.Decimal(parsed.data.amount);

    const updated = await prisma.$transaction(async (tx) => {
      const existing = await tx.payment.findUnique({ where: { id } });
      if (!existing) throw new PaymentDomainError("notFound");
      if (existing.status !== "CONFIRMED") throw new PaymentDomainError("cancelled");

      const [supplier, cashbox] = await Promise.all([
        tx.supplier.findUnique({ where: { id: supplierId } }),
        tx.cashbox.findUnique({ where: { id: cashboxId } }),
      ]);
      if (!supplier || !cashbox) throw new PaymentDomainError("notFound");
      if (!supplier.isActive || !cashbox.isActive) throw new PaymentDomainError("inactive");

      const removed = await reversePaymentEffect(tx, existing);

      const reappliedSupplierUpdate = await tx.supplier.updateMany({
        where: { id: supplierId, balance: { gte: amount } }, data: { balance: { decrement: amount } },
      });
      if (reappliedSupplierUpdate.count !== 1) throw new PaymentDomainError("exceedsBalance");
      const finalSupplier = await tx.supplier.findUniqueOrThrow({ where: { id: supplierId } });
      const finalCashbox = await tx.cashbox.update({ where: { id: cashboxId }, data: { balance: { decrement: amount } } });

      const occurredAt = new Date();
      await tx.payment.update({
        where: { id }, data: { supplierId, cashboxId, amount, note, occurredAt },
      });
      await tx.cashMovement.create({ data: {
        cashboxId, type: "SUPPLIER_PAYMENT", amount: amount.negated(), balanceAfter: finalCashbox.balance,
        supplierId, refType: "PAYMENT", refId: id, note, createdById: user.id, createdAt: occurredAt,
      } });
      await tx.partyTransaction.create({ data: {
        partyType: "SUPPLIER", supplierId, type: "PAYMENT", debit: new Prisma.Decimal(0), credit: amount,
        balanceAfter: finalSupplier.balance, refType: "PAYMENT", refId: id,
        note, occurredAt, createdById: user.id,
      } });
      await restampDocumentCash(tx, { refType: "PAYMENT", refId: id }, removed.removedCash.firstMovedAt);
      await restampDocumentPartyEntries(tx, { refType: "PAYMENT", refId: id }, removed.removedParty);

      await syncNotifications(tx, { supplierIds: [existing.supplierId, supplierId] });
      await writeAudit(tx, {
        userId: user.id, action: "payment.update", entityType: "Payment",
        entityId: id, entityLabel: `#${String(existing.number).padStart(6, "0")}`,
        before: { supplierId: existing.supplierId, cashboxId: existing.cashboxId, amount: existing.amount.toString() },
        after: { supplierId, cashboxId, amount: amount.toString() },
      });
      return { id, number: existing.number };
    }, { timeout: 20_000 });

    revalidatePath("/payments");
    revalidatePath("/cashboxes");
    revalidatePath(`/suppliers/${supplierId}`);
    return ok(updated);
  } catch (error) {
    return actionError(error);
  }
}

export async function deletePayment(id: unknown): Promise<ActionResult<{ number: number }>> {
  try {
    const user = await requirePermission("payment.cancel");
    const parsedId = partyIdSchema.safeParse(id);
    if (!parsedId.success) return fail(m.invalid);

    const deleted = await prisma.$transaction(async (tx) => {
      const payment = await tx.payment.findUnique({ where: { id: parsedId.data } });
      if (!payment) throw new PaymentDomainError("notFound");
      if (payment.status !== "CONFIRMED") throw new PaymentDomainError("cancelled");

      await reversePaymentEffect(tx, payment);

      await writeAudit(tx, {
        userId: user.id, action: "payment.delete", entityType: "Payment",
        entityId: payment.id, entityLabel: `#${String(payment.number).padStart(6, "0")}`,
        before: { status: payment.status, amount: payment.amount.toString() },
        after: undefined,
      });

      await tx.payment.delete({ where: { id: parsedId.data } });

      await syncNotifications(tx, { supplierIds: [payment.supplierId] });

      return { number: payment.number };
    }, { timeout: 20_000 });

    revalidatePath("/payments");
    revalidatePath("/cashboxes");
    return ok(deleted);
  } catch (error) {
    return actionError(error);
  }
}
