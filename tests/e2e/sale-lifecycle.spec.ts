import { test, expect } from "@playwright/test";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * End-to-end walk: log in as admin (tile + password) -> create a credit sale for a
 * scratch customer -> verify inventory decreased -> collect a payment -> verify the
 * customer's balance dropped -> open the sales report -> cancel the invoice -> verify
 * stock and balance both reversed. Runs against the real dev server + Neon dev DB,
 * driving the actual UI rather than calling actions directly (that's what the
 * `tests/integration/*.test.ts` suite already covers).
 */

let productId: string;
let productName: string;
let customerId: string;
let customerName: string;
let cashboxId: string;
let cashboxName: string;

test.beforeAll(async () => {
  const suffix = Date.now();
  const product = await prisma.product.create({
    data: {
      sku: `E2E-SKU-${suffix}`,
      name: `منتج اختبار E2E ${suffix}`,
      baseUnitName: "كرتونة",
      subUnitName: "قطعة",
      unitsPerBase: 10,
      purchasePricePerBase: 100,
      sellPricePerBase: 200,
      avgCostPerSub: 10,
      stockQty: 50,
      minStockQty: 5,
      isActive: true,
    },
  });
  productId = product.id;
  productName = product.name;

  const customer = await prisma.customer.create({
    data: {
      name: `عميل اختبار E2E ${suffix}`,
      openingBalance: 0,
      balance: 0,
      isActive: true,
    },
  });
  customerId = customer.id;
  customerName = customer.name;

  const cashbox = await prisma.cashbox.create({
    data: {
      name: `خزينة اختبار E2E ${suffix}`,
      openingBalance: 0,
      balance: 0,
      isActive: true,
      sortOrder: 999,
    },
  });
  cashboxId = cashbox.id;
  cashboxName = cashbox.name;
});

test.afterAll(async () => {
  // Guard against beforeAll having failed partway (e.g. a transient DB disconnect) —
  // an unguarded deleteMany({ where: { productId: undefined } }) matches every row in
  // the table, since Prisma treats an undefined filter value as "no filter".
  await prisma.$transaction([
    ...(productId ? [prisma.stockMovement.deleteMany({ where: { productId } })] : []),
    ...(cashboxId || customerId
      ? [
          prisma.cashMovement.deleteMany({
            where: { OR: [...(cashboxId ? [{ cashboxId }] : []), ...(customerId ? [{ customerId }] : [])] },
          }),
        ]
      : []),
    ...(customerId ? [prisma.partyTransaction.deleteMany({ where: { customerId } })] : []),
    ...(productId ? [prisma.invoiceLine.deleteMany({ where: { productId } })] : []),
    ...(cashboxId || customerId
      ? [
          prisma.invoice.deleteMany({
            where: { OR: [...(customerId ? [{ customerId }] : []), ...(cashboxId ? [{ cashboxId }] : [])] },
          }),
        ]
      : []),
    ...(customerId ? [prisma.collection.deleteMany({ where: { customerId } })] : []),
    ...(productId ? [prisma.product.deleteMany({ where: { id: productId } })] : []),
    ...(customerId ? [prisma.customer.deleteMany({ where: { id: customerId } })] : []),
    ...(cashboxId ? [prisma.cashbox.deleteMany({ where: { id: cashboxId } })] : []),
  ]);
  await prisma.$disconnect();
});

test.setTimeout(120_000);

test("login -> credit sale -> stock decreases -> collection -> balance drops -> report shows it -> cancel reverses everything", async ({ page }) => {
  // --- Login (tile grid -> password) ---
  await page.goto("/login");
  await page.getByRole("button", { name: /يوسف محمود/ }).click();
  await page.getByRole("textbox", { name: "كلمة المرور" }).fill("Passw0rd!");
  await page.getByRole("button", { name: "تسجيل الدخول" }).click();
  await expect(page).toHaveURL("/", { timeout: 15_000 });

  // --- Create a credit sale for the scratch customer/product/cashbox ---
  await page.goto("/sales/new");
  const search = page.getByRole("textbox", { name: "ابحث بالاسم أو الباركود..." });
  await search.click();
  await search.pressSequentially(productName, { delay: 20 });
  await page.getByRole("button", { name: new RegExp(productName) }).click({ timeout: 20_000 });

  await page.getByRole("combobox").filter({ hasText: "عميل نقدي" }).click();
  await page.getByRole("option", { name: customerName }).click();
  await page.getByRole("combobox").filter({ hasText: "النقدية" }).click();
  await page.getByRole("option", { name: cashboxName }).click();

  await page.getByRole("spinbutton", { name: "الكمية" }).fill("3");
  // Added at the SUB unit (default), priced at sellPricePerBase/unitsPerBase = 200/10 = 20/unit.
  // Paid amount left at 0 -> the whole 60 (3 * 20) becomes the customer's credit balance.
  await page.getByRole("button", { name: "حفظ الفاتورة" }).click();
  await expect(page).toHaveURL(/\/sales\/(?!new$)[a-z0-9]+$/, { timeout: 20_000 });

  const saleUrl = page.url();
  const saleId = saleUrl.split("/").pop()!;

  // --- Verify inventory decreased (3 sub-units sold from 50) ---
  const productAfterSale = await prisma.product.findUniqueOrThrow({ where: { id: productId } });
  expect(productAfterSale.stockQty.toString()).toBe("47");

  const customerAfterSale = await prisma.customer.findUniqueOrThrow({ where: { id: customerId } });
  expect(customerAfterSale.balance.toString()).toBe("60");

  // --- Collect part of the balance ---
  await page.goto("/collections/new");
  await page.getByRole("combobox").nth(0).click();
  await page.getByRole("option", { name: customerName }).click();
  await page.getByRole("combobox").nth(1).click();
  await page.getByRole("option", { name: cashboxName }).click();
  await page.locator("#amount").fill("25");
  await page.getByRole("button", { name: /حفظ/ }).click();
  await expect(page).toHaveURL(/\/collections$/, { timeout: 15_000 });

  const customerAfterCollection = await prisma.customer.findUniqueOrThrow({ where: { id: customerId } });
  expect(customerAfterCollection.balance.toString()).toBe("35");

  // --- Open the sales report and confirm it renders without error ---
  await page.goto("/reports/sales");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible({ timeout: 15_000 });

  // --- Cancel the sale and verify everything reverses ---
  await page.goto(`/sales/${saleId}`);
  await page.getByRole("button", { name: "حذف الفاتورة" }).click();
  await page.getByRole("textbox", { name: "سبب الحذف" }).fill("اختبار E2E تلقائي");
  await page.getByRole("button", { name: "تأكيد الحذف" }).click();
  await expect(page.getByText(new RegExp(`تم إلغاء الفاتورة`))).toBeVisible({ timeout: 15_000 });

  const productAfterCancel = await prisma.product.findUniqueOrThrow({ where: { id: productId } });
  expect(productAfterCancel.stockQty.toString()).toBe("50");

  const customerAfterCancel = await prisma.customer.findUniqueOrThrow({ where: { id: customerId } });
  // 60 credit reversed, minus the 25 already collected (which the cancel does not touch)
  // leaves -25: the sale's reversal overshoots what's left owed, since the collection
  // already reduced it independently of the invoice being reversed.
  expect(customerAfterCancel.balance.toString()).toBe("-25");

  const saleRow = await prisma.invoice.findUnique({ where: { id: saleId } });
  expect(saleRow).toBeNull();
});
