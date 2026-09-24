import { afterAll, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import { createCollection, deleteCollection, updateCollection } from "@/actions/collections.actions";
import {
  asUser,
  createScratchCashbox,
  createScratchCustomer,
  purgeCashbox,
  purgeCustomer,
} from "./helpers";

async function purgeCollection(collectionId: string) {
  await prisma.$transaction([
    prisma.cashMovement.deleteMany({ where: { refType: "COLLECTION", refId: collectionId } }),
    prisma.partyTransaction.deleteMany({ where: { refType: "COLLECTION", refId: collectionId } }),
    prisma.auditLog.deleteMany({ where: { entityId: collectionId, entityType: "Collection" } }),
    prisma.collection.deleteMany({ where: { id: collectionId } }),
  ]);
}

describe("collection transactions", () => {
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("creating a collection: cashbox increases, customer balance decreases by the same amount", async () => {
    await asUser("admin");
    const cashbox = await createScratchCashbox({ balance: 0 });
    const customer = await createScratchCustomer({ balance: 100 });
    let collectionId: string | undefined;
    try {
      const result = await createCollection({ customerId: customer.id, cashboxId: cashbox.id, amount: "60" });
      expect(result.success).toBe(true);
      if (!result.success) return;
      collectionId = result.data.id;

      const cashboxAfter = await prisma.cashbox.findUniqueOrThrow({ where: { id: cashbox.id } });
      const customerAfter = await prisma.customer.findUniqueOrThrow({ where: { id: customer.id } });
      expect(cashboxAfter.balance.toString()).toBe("60");
      expect(customerAfter.balance.toString()).toBe("40");
    } finally {
      if (collectionId) await purgeCollection(collectionId);
      await purgeCashbox(cashbox.id);
      await purgeCustomer(customer.id);
    }
  });

  it("rejects collecting more than the customer's outstanding balance", async () => {
    await asUser("admin");
    const cashbox = await createScratchCashbox({ balance: 0 });
    const customer = await createScratchCustomer({ balance: 30 });
    try {
      const result = await createCollection({ customerId: customer.id, cashboxId: cashbox.id, amount: "50" });
      expect(result.success).toBe(false);

      const cashboxAfter = await prisma.cashbox.findUniqueOrThrow({ where: { id: cashbox.id } });
      const customerAfter = await prisma.customer.findUniqueOrThrow({ where: { id: customer.id } });
      expect(cashboxAfter.balance.toString()).toBe("0");
      expect(customerAfter.balance.toString()).toBe("30");
    } finally {
      await purgeCashbox(cashbox.id);
      await purgeCustomer(customer.id);
    }
  });

  it("deleting (cancelling) a collection reverses cash and customer balance exactly", async () => {
    await asUser("admin");
    const cashbox = await createScratchCashbox({ balance: 0 });
    const customer = await createScratchCustomer({ balance: 100 });
    let collectionId: string | undefined;
    try {
      const created = await createCollection({ customerId: customer.id, cashboxId: cashbox.id, amount: "60" });
      if (!created.success) throw new Error("setup failed");
      collectionId = created.data.id;

      const deleted = await deleteCollection(collectionId);
      expect(deleted.success).toBe(true);

      const cashboxAfter = await prisma.cashbox.findUniqueOrThrow({ where: { id: cashbox.id } });
      const customerAfter = await prisma.customer.findUniqueOrThrow({ where: { id: customer.id } });
      expect(cashboxAfter.balance.toString()).toBe("0");
      expect(customerAfter.balance.toString()).toBe("100");

      const row = await prisma.collection.findUnique({ where: { id: collectionId } });
      expect(row).toBeNull();
      collectionId = undefined;
    } finally {
      if (collectionId) await purgeCollection(collectionId);
      await purgeCashbox(cashbox.id);
      await purgeCustomer(customer.id);
    }
  });

  it("editing a collection's amount reverses the old effect and reapplies the new one", async () => {
    await asUser("admin");
    const cashbox = await createScratchCashbox({ balance: 0 });
    const customer = await createScratchCustomer({ balance: 100 });
    let collectionId: string | undefined;
    try {
      const created = await createCollection({ customerId: customer.id, cashboxId: cashbox.id, amount: "40" });
      if (!created.success) throw new Error("setup failed");
      collectionId = created.data.id;

      const edited = await updateCollection({
        id: collectionId,
        customerId: customer.id,
        cashboxId: cashbox.id,
        amount: "70",
      });
      expect(edited.success).toBe(true);

      const cashboxAfter = await prisma.cashbox.findUniqueOrThrow({ where: { id: cashbox.id } });
      const customerAfter = await prisma.customer.findUniqueOrThrow({ where: { id: customer.id } });
      expect(cashboxAfter.balance.toString()).toBe("70");
      expect(customerAfter.balance.toString()).toBe("30");
    } finally {
      if (collectionId) await purgeCollection(collectionId);
      await purgeCashbox(cashbox.id);
      await purgeCustomer(customer.id);
    }
  });

  it("cashier can create a collection but cannot cancel/delete one (lacks collection.cancel)", async () => {
    await asUser("cashier1");
    const cashbox = await createScratchCashbox({ balance: 0 });
    const customer = await createScratchCustomer({ balance: 50 });
    let collectionId: string | undefined;
    try {
      const result = await createCollection({ customerId: customer.id, cashboxId: cashbox.id, amount: "10" });
      expect(result.success).toBe(true); // cashier HAS collection.create per seed
      if (!result.success) return;
      collectionId = result.data.id;

      const deleteAttempt = await deleteCollection(collectionId);
      expect(deleteAttempt.success).toBe(false); // cashier lacks collection.cancel per seed
    } finally {
      if (collectionId) await purgeCollection(collectionId);
      await purgeCashbox(cashbox.id);
      await purgeCustomer(customer.id);
    }
  });
});
