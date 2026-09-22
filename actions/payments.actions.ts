"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { AuthRequiredError, PermissionDeniedError, requirePermission } from "@/lib/auth-guard";
import { writeAudit } from "@/lib/audit";
import { fail, ok } from "@/lib/action-result";
import { nextDocumentNumber } from "@/lib/numbering";
import { prisma } from "@/lib/prisma";
import { syncNotifications } from "@/lib/notifications";
import { cancelMoneyDocumentSchema, createPaymentSchema } from "@/lib/validations";
import messages from "@/messages/ar.json";
import type { ActionResult, EntityComboboxOption, MoneyDocumentRow, PartyWithBalanceOption } from "@/types";

const m = messages.moneyAction;

class PaymentDomainError extends Error {
  constructor(public readonly code: "notFound" | "inactive" | "exceedsBalance" | "insufficientCash" | "cancelled") { super(code); }
}

function actionError<T>(error: unknown): ActionResult<T> {
  if (error instanceof AuthRequiredError) return fail(m.unauthorized);
  if (error instanceof PermissionDeniedError) return fail(m.forbidden);
  if (error instanceof PaymentDomainError) return fail(m[error.code]);
  console.error("Payment action failed", error);
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
      partyName: payment.supplier.name,
      cashboxName: payment.cashbox.name,
      amount: payment.amount.toString(),
      status: payment.status,
      occurredAt: payment.occurredAt.toISOString(),
    })));
  } catch (error) {
    return actionError(error);
  }
}

export async function getPaymentFormOptions(): Promise<ActionResult<{ parties: PartyWithBalanceOption[]; cashboxes: EntityComboboxOption[] }>> {
  try {
    await requirePermission("payment.create");
    const [suppliers, cashboxes] = await Promise.all([
      prisma.supplier.findMany({ where: { isActive: true, balance: { gt: 0 } }, orderBy: { name: "asc" } }),
      prisma.cashbox.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } }),
    ]);
    return ok({
      parties: suppliers.map((supplier) => ({ value: supplier.id, label: supplier.name, balance: supplier.balance.toString() })),
      cashboxes: cashboxes.map((cashbox) => ({ value: cashbox.id, label: cashbox.name })),
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
    const { supplierId, cashboxId, note } = parsed.data;
    const amount = new Prisma.Decimal(parsed.data.amount);
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
      const cashboxUpdate = await tx.cashbox.updateMany({
        where: { id: cashboxId, balance: { gte: amount } }, data: { balance: { decrement: amount } },
      });
      if (cashboxUpdate.count !== 1) throw new PaymentDomainError("insufficientCash");
      const updatedCashbox = await tx.cashbox.findUniqueOrThrow({ where: { id: cashboxId } });
      const number = await nextDocumentNumber(tx, "PAYMENT");
      const occurredAt = new Date();
      const payment = await tx.payment.create({
        data: { number, supplierId, cashboxId, amount, note, occurredAt, createdById: user.id },
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
      await syncNotifications(tx, { supplierIds: [supplierId] });
      await writeAudit(tx, {
        userId: user.id, action: "payment.create", entityType: "Payment",
        entityId: payment.id, entityLabel: `#${String(number).padStart(6, "0")}`,
        after: { supplierId, cashboxId, amount: amount.toString() },
      });
      return { id: payment.id, number };
    });
    revalidatePath("/payments");
    revalidatePath("/cashboxes");
    revalidatePath(`/suppliers/${supplierId}`);
    return ok(created);
  } catch (error) {
    return actionError(error);
  }
}

export async function cancelPayment(input: unknown): Promise<ActionResult<{ id: string }>> {
  try {
    const user = await requirePermission("payment.cancel");
    const parsed = cancelMoneyDocumentSchema.safeParse(input);
    if (!parsed.success) return fail(m.invalid, parsed.error.flatten().fieldErrors);
    const { id, reason } = parsed.data;
    const supplierId = await prisma.$transaction(async (tx) => {
      const payment = await tx.payment.findUnique({ where: { id }, include: { supplier: true } });
      if (!payment) throw new PaymentDomainError("notFound");
      if (payment.status === "CANCELLED") throw new PaymentDomainError("cancelled");
      const occurredAt = new Date();
      const cancelUpdate = await tx.payment.updateMany({
        where: { id, status: "CONFIRMED" },
        data: { status: "CANCELLED", cancelledAt: occurredAt, cancelledById: user.id },
      });
      if (cancelUpdate.count !== 1) throw new PaymentDomainError("cancelled");
      const updatedCashbox = await tx.cashbox.update({
        where: { id: payment.cashboxId }, data: { balance: { increment: payment.amount } },
      });
      const updatedSupplier = await tx.supplier.update({
        where: { id: payment.supplierId }, data: { balance: { increment: payment.amount } },
      });
      await tx.cashMovement.create({ data: {
        cashboxId: payment.cashboxId, type: "SUPPLIER_PAYMENT", amount: payment.amount,
        balanceAfter: updatedCashbox.balance, supplierId: payment.supplierId,
        refType: "PAYMENT", refId: id, note: reason, createdById: user.id, createdAt: occurredAt,
      } });
      await tx.partyTransaction.create({ data: {
        partyType: "SUPPLIER", supplierId: payment.supplierId, type: "PAYMENT",
        debit: payment.amount, credit: new Prisma.Decimal(0), balanceAfter: updatedSupplier.balance,
        refType: "PAYMENT", refId: id, note: reason, occurredAt, createdById: user.id,
      } });
      await syncNotifications(tx, { supplierIds: [payment.supplierId] });
      await writeAudit(tx, {
        userId: user.id, action: "payment.cancel", entityType: "Payment",
        entityId: id, entityLabel: `#${String(payment.number).padStart(6, "0")}`,
        before: { status: "CONFIRMED" }, after: { status: "CANCELLED", reason },
      });
      return payment.supplierId;
    });
    revalidatePath("/payments");
    revalidatePath("/cashboxes");
    revalidatePath(`/suppliers/${supplierId}`);
    return ok({ id });
  } catch (error) {
    return actionError(error);
  }
}
