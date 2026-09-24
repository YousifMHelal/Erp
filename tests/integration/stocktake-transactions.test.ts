import { afterAll, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import { confirmStocktake, deleteStocktake, updateStocktake } from "@/actions/stocktake.actions";
import { asUser, createScratchProduct, purgeProduct } from "./helpers";

async function purgeStocktake(stocktakeId: string) {
  await prisma.$transaction([
    prisma.stockMovement.deleteMany({ where: { refType: "STOCKTAKE", refId: stocktakeId } }),
    prisma.auditLog.deleteMany({ where: { entityId: stocktakeId, entityType: "Stocktake" } }),
    prisma.stocktakeLine.deleteMany({ where: { stocktakeId } }),
    prisma.stocktake.deleteMany({ where: { id: stocktakeId } }),
  ]);
}

describe("stocktake transactions", () => {
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("confirming sets stock directly to the counted quantity and writes one movement for a non-zero difference", async () => {
    await asUser("admin");
    const product = await createScratchProduct({ stockQty: 100 });
    let stocktakeId: string | undefined;
    try {
      const result = await confirmStocktake({
        lines: [{ productId: product.id, countedQty: "93" }],
      });
      expect(result.success).toBe(true);
      if (!result.success) return;
      stocktakeId = result.data.id;

      const productAfter = await prisma.product.findUniqueOrThrow({ where: { id: product.id } });
      expect(productAfter.stockQty.toString()).toBe("93");

      const movement = await prisma.stockMovement.findFirst({ where: { refType: "STOCKTAKE", refId: stocktakeId } });
      expect(movement?.qtyInSub.toString()).toBe("-7");
    } finally {
      if (stocktakeId) await purgeStocktake(stocktakeId);
      await purgeProduct(product.id);
    }
  });

  it("records a zero-difference line without writing a stock movement", async () => {
    await asUser("admin");
    const product = await createScratchProduct({ stockQty: 50 });
    let stocktakeId: string | undefined;
    try {
      const result = await confirmStocktake({
        lines: [{ productId: product.id, countedQty: "50" }],
      });
      expect(result.success).toBe(true);
      if (!result.success) return;
      stocktakeId = result.data.id;

      const movement = await prisma.stockMovement.findFirst({ where: { refType: "STOCKTAKE", refId: stocktakeId } });
      expect(movement).toBeNull();

      const line = await prisma.stocktakeLine.findFirst({ where: { stocktakeId, productId: product.id } });
      expect(line?.differenceInSub.toString()).toBe("0");
    } finally {
      if (stocktakeId) await purgeStocktake(stocktakeId);
      await purgeProduct(product.id);
    }
  });

  it("updating a confirmed stocktake adjusts against current live stock, not the original system qty", async () => {
    await asUser("admin");
    const product = await createScratchProduct({ stockQty: 100 });
    let stocktakeId: string | undefined;
    try {
      const created = await confirmStocktake({
        lines: [{ productId: product.id, countedQty: "90" }],
      });
      if (!created.success) throw new Error("setup failed");
      stocktakeId = created.data.id;

      // Simulate other activity moving stock after the stocktake (e.g. a sale) directly.
      await prisma.product.update({ where: { id: product.id }, data: { stockQty: { decrement: 5 } } });
      // Live stock is now 85. Correcting the count to 88 should move live stock by +3 (88-85), landing at 88.
      const edited = await updateStocktake({
        id: stocktakeId,
        lines: [{ productId: product.id, countedQty: "88" }],
      });
      expect(edited.success).toBe(true);

      const productAfter = await prisma.product.findUniqueOrThrow({ where: { id: product.id } });
      expect(productAfter.stockQty.toString()).toBe("88");

      const line = await prisma.stocktakeLine.findFirst({ where: { stocktakeId, productId: product.id } });
      // systemQtyInSub (the historical fact from confirm time) must stay 100, unchanged by the edit.
      expect(line?.systemQtyInSub.toString()).toBe("100");
      expect(line?.countedQtyInSub.toString()).toBe("88");
    } finally {
      if (stocktakeId) await purgeStocktake(stocktakeId);
      await purgeProduct(product.id);
    }
  });

  it("deleting a confirmed stocktake reverses its recorded difference against current live stock", async () => {
    await asUser("admin");
    const product = await createScratchProduct({ stockQty: 100 });
    let stocktakeId: string | undefined;
    try {
      const created = await confirmStocktake({
        lines: [{ productId: product.id, countedQty: "80" }], // difference -20
      });
      if (!created.success) throw new Error("setup failed");
      stocktakeId = created.data.id;

      const afterConfirm = await prisma.product.findUniqueOrThrow({ where: { id: product.id } });
      expect(afterConfirm.stockQty.toString()).toBe("80");

      const deleted = await deleteStocktake(stocktakeId);
      expect(deleted.success).toBe(true);

      const afterDelete = await prisma.product.findUniqueOrThrow({ where: { id: product.id } });
      expect(afterDelete.stockQty.toString()).toBe("100");

      const stocktakeRow = await prisma.stocktake.findUnique({ where: { id: stocktakeId } });
      expect(stocktakeRow).toBeNull();
      stocktakeId = undefined;
    } finally {
      if (stocktakeId) await purgeStocktake(stocktakeId);
      await purgeProduct(product.id);
    }
  });

  it("rejects a permission-denied stocktake confirm for a role without inventory.stocktake", async () => {
    await asUser("cashier1");
    const product = await createScratchProduct({ stockQty: 10 });
    try {
      const result = await confirmStocktake({ lines: [{ productId: product.id, countedQty: "5" }] });
      expect(result.success).toBe(false);
    } finally {
      await purgeProduct(product.id);
    }
  });
});
