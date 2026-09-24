import { PrismaClient, Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";
import { ALL_PERMISSIONS } from "../lib/permissions";

const prisma = new PrismaClient();

// Neon's pooled connection is slow enough that the default 5s interactive-transaction
// timeout gets tripped by a multi-line sale/purchase transaction; give seed transactions room.
function seedTransaction<T>(fn: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T> {
  return prisma.$transaction(fn, { timeout: 20_000 });
}

const D = (v: number | string) => new Prisma.Decimal(v);

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick<T>(arr: T[]): T {
  const item = arr[randomInt(0, arr.length - 1)];
  if (item === undefined) throw new Error("pick() called on empty array");
  return item;
}

const CASHIER_PERMISSIONS = [
  "sale.view",
  "sale.create",
  "sale.print",
  "return.view",
  "return.create",
  "inventory.view",
  "customer.view",
  "customer.create",
  "cashbox.view",
  "collection.view",
  "collection.create",
];

const ACCOUNTANT_PERMISSIONS = ALL_PERMISSIONS.filter(
  (p) => !p.startsWith("user.") && !p.startsWith("role.") && p !== "settings.manage" && p !== "settings.backup",
);

async function main() {
  console.log("Seeding Teba database...");

  // -- Settings ---------------------------------------------------------
  await prisma.setting.createMany({
    data: [
      { key: "shop.name", value: "طيبة للتجارة" },
      { key: "shop.phone", value: "01012345678" },
      { key: "shop.address", value: "شارع الجمهورية، المنصورة، الدقهلية" },
      { key: "shop.taxNote", value: "" },
      { key: "shop.invoiceFooter", value: "شكراً لتعاملكم معنا" },
      { key: "print.defaultSize", value: "A4" },
      { key: "loginMode", value: "tiles" },
    ],
  });

  // -- Roles --------------------------------------------------------------
  const managerRole = await prisma.role.create({
    data: {
      name: "مدير",
      description: "صلاحية كاملة على كل أجزاء النظام",
      isSystem: true,
      permissions: ALL_PERMISSIONS,
    },
  });
  const accountantRole = await prisma.role.create({
    data: {
      name: "محاسب",
      description: "إدارة الفواتير والمخزون والتقارير، بدون إدارة المستخدمين",
      isSystem: false,
      permissions: ACCOUNTANT_PERMISSIONS,
    },
  });
  const cashierRole = await prisma.role.create({
    data: {
      name: "كاشير",
      description: "إنشاء فواتير البيع والتحصيل فقط",
      isSystem: false,
      permissions: CASHIER_PERMISSIONS,
    },
  });

  // -- Users ----------------------------------------------------------------
  const passwordHash = await bcrypt.hash("Passw0rd!", 10);
  const [adminUser, accountantUser, cashierUser1, cashierUser2] = await Promise.all([
    prisma.user.create({
      data: {
        username: "admin",
        displayName: "يوسف محمود",
        passwordHash,
        avatarColor: "#2A2F6B",
        roleId: managerRole.id,
      },
    }),
    prisma.user.create({
      data: {
        username: "accountant",
        displayName: "منى السيد",
        passwordHash,
        avatarColor: "#14B8A6",
        roleId: accountantRole.id,
      },
    }),
    prisma.user.create({
      data: {
        username: "cashier1",
        displayName: "أحمد فتحي",
        passwordHash,
        avatarColor: "#5F6ABB",
        roleId: cashierRole.id,
      },
    }),
    prisma.user.create({
      data: {
        username: "cashier2",
        displayName: "سارة عادل",
        passwordHash,
        avatarColor: "#0D9488",
        roleId: cashierRole.id,
      },
    }),
  ]);
  const users = [adminUser, accountantUser, cashierUser1, cashierUser2];
  const systemUser = adminUser;

  // -- Cashboxes --------------------------------------------------------------
  const cashboxSeed = [
    { name: "نقدي", opening: 15000 },
    { name: "فودافون كاش", opening: 5000 },
    { name: "إنستاباي", opening: 3000 },
  ];
  const cashboxes = [];
  for (let i = 0; i < cashboxSeed.length; i++) {
    const c = cashboxSeed[i]!;
    cashboxes.push(
      await prisma.cashbox.create({
        data: {
          name: c.name,
          openingBalance: D(c.opening),
          balance: D(c.opening),
          sortOrder: i,
        },
      }),
    );
  }
  // running per-cashbox balance, kept in lockstep with every CashMovement written
  const cashboxBalances = new Map(cashboxes.map((c) => [c.id, D(cashboxSeed.find((s) => s.name === c.name)!.opening)]));

  async function writeCashMovement(input: {
    cashboxId: string;
    type: Prisma.CashMovementCreateInput["type"];
    amount: Prisma.Decimal; // signed
    refType: string;
    refId: string;
    invoiceId?: string;
    customerId?: string;
    supplierId?: string;
    transferId?: string;
    note?: string;
    createdById: string;
    createdAt: Date;
    tx: Prisma.TransactionClient;
  }) {
    const current = cashboxBalances.get(input.cashboxId)!;
    const balanceAfter = current.plus(input.amount);
    cashboxBalances.set(input.cashboxId, balanceAfter);
    await input.tx.cashMovement.create({
      data: {
        cashboxId: input.cashboxId,
        type: input.type,
        amount: input.amount,
        balanceAfter,
        refType: input.refType,
        refId: input.refId,
        invoiceId: input.invoiceId,
        customerId: input.customerId,
        supplierId: input.supplierId,
        transferId: input.transferId,
        note: input.note,
        createdById: input.createdById,
        createdAt: input.createdAt,
      },
    });
    await input.tx.cashbox.update({ where: { id: input.cashboxId }, data: { balance: balanceAfter } });
  }

  // -- Categories -----------------------------------------------------------
  const categoryNames = [
    "مواد غذائية",
    "منظفات",
    "مشروبات",
    "ألبان وأجبان",
    "معلبات",
    "حلويات",
    "أدوات منزلية",
    "عناية شخصية",
  ];
  const categories = await Promise.all(
    categoryNames.map((name) => prisma.category.create({ data: { name } })),
  );

  // -- Products ---------------------------------------------------------------
  const productDefs: {
    name: string;
    categoryIdx: number;
    baseUnitName: string;
    subUnitName: string;
    unitsPerBase: number;
    purchasePricePerBase: number;
    sellPricePerBase: number;
    openingStockSub: number;
    minStockQty: number;
  }[] = [
    { name: "أرز أبو كاس 1 كجم", categoryIdx: 0, baseUnitName: "كرتونة", subUnitName: "كيس", unitsPerBase: 10, purchasePricePerBase: 450, sellPricePerBase: 550, openingStockSub: 300, minStockQty: 50 },
    { name: "سكر خشن 1 كجم", categoryIdx: 0, baseUnitName: "كرتونة", subUnitName: "كيس", unitsPerBase: 10, purchasePricePerBase: 380, sellPricePerBase: 460, openingStockSub: 250, minStockQty: 40 },
    { name: "زيت عافية 1.5 لتر", categoryIdx: 0, baseUnitName: "كرتونة", subUnitName: "زجاجة", unitsPerBase: 12, purchasePricePerBase: 720, sellPricePerBase: 840, openingStockSub: 180, minStockQty: 30 },
    { name: "مكرونة أبو كاس", categoryIdx: 0, baseUnitName: "كرتونة", subUnitName: "علبة", unitsPerBase: 20, purchasePricePerBase: 200, sellPricePerBase: 260, openingStockSub: 400, minStockQty: 60 },
    { name: "دقيق فاخر 1 كجم", categoryIdx: 0, baseUnitName: "كرتونة", subUnitName: "كيس", unitsPerBase: 10, purchasePricePerBase: 300, sellPricePerBase: 380, openingStockSub: 220, minStockQty: 40 },
    { name: "شاي العروسة 100 فتلة", categoryIdx: 0, baseUnitName: "كرتونة", subUnitName: "علبة", unitsPerBase: 24, purchasePricePerBase: 960, sellPricePerBase: 1200, openingStockSub: 96, minStockQty: 24 },
    { name: "ملح طعام 1 كجم", categoryIdx: 0, baseUnitName: "كرتونة", subUnitName: "كيس", unitsPerBase: 20, purchasePricePerBase: 100, sellPricePerBase: 140, openingStockSub: 300, minStockQty: 40 },
    { name: "عدس أصفر 1 كجم", categoryIdx: 0, baseUnitName: "كرتونة", subUnitName: "كيس", unitsPerBase: 10, purchasePricePerBase: 420, sellPricePerBase: 500, openingStockSub: 150, minStockQty: 30 },

    { name: "صابون أريال 3 كجم", categoryIdx: 1, baseUnitName: "كرتونة", subUnitName: "علبة", unitsPerBase: 6, purchasePricePerBase: 900, sellPricePerBase: 1080, openingStockSub: 60, minStockQty: 12 },
    { name: "سائل تحضير بيرسيل", categoryIdx: 1, baseUnitName: "كرتونة", subUnitName: "زجاجة", unitsPerBase: 6, purchasePricePerBase: 480, sellPricePerBase: 600, openingStockSub: 48, minStockQty: 12 },
    { name: "صابون فيري غسيل أطباق", categoryIdx: 1, baseUnitName: "كرتونة", subUnitName: "زجاجة", unitsPerBase: 12, purchasePricePerBase: 360, sellPricePerBase: 480, openingStockSub: 96, minStockQty: 24 },
    { name: "مسحوق كلوركس", categoryIdx: 1, baseUnitName: "كرتونة", subUnitName: "زجاجة", unitsPerBase: 12, purchasePricePerBase: 240, sellPricePerBase: 336, openingStockSub: 72, minStockQty: 20 },
    { name: "مناديل فايس", categoryIdx: 1, baseUnitName: "كرتونة", subUnitName: "علبة", unitsPerBase: 24, purchasePricePerBase: 480, sellPricePerBase: 600, openingStockSub: 8, minStockQty: 24 },
    { name: "أكياس قمامة كبير", categoryIdx: 1, baseUnitName: "كرتونة", subUnitName: "رول", unitsPerBase: 20, purchasePricePerBase: 300, sellPricePerBase: 400, openingStockSub: 5, minStockQty: 30 },

    { name: "بيبسي 1.5 لتر", categoryIdx: 2, baseUnitName: "كرتونة", subUnitName: "زجاجة", unitsPerBase: 12, purchasePricePerBase: 240, sellPricePerBase: 300, openingStockSub: 144, minStockQty: 24 },
    { name: "مياه معدنية بركة 1.5 لتر", categoryIdx: 2, baseUnitName: "كرتونة", subUnitName: "زجاجة", unitsPerBase: 12, purchasePricePerBase: 120, sellPricePerBase: 168, openingStockSub: 240, minStockQty: 36 },
    { name: "عصير بيتي فوري 235 مل", categoryIdx: 2, baseUnitName: "كرتونة", subUnitName: "علبة", unitsPerBase: 24, purchasePricePerBase: 168, sellPricePerBase: 216, openingStockSub: 0, minStockQty: 24 },
    { name: "شاي مثلج ليبتون", categoryIdx: 2, baseUnitName: "كرتونة", subUnitName: "زجاجة", unitsPerBase: 12, purchasePricePerBase: 216, sellPricePerBase: 276, openingStockSub: 84, minStockQty: 20 },
    { name: "قهوة سريعة الذوبان نسكافيه", categoryIdx: 2, baseUnitName: "كرتونة", subUnitName: "علبة", unitsPerBase: 24, purchasePricePerBase: 1440, sellPricePerBase: 1800, openingStockSub: 48, minStockQty: 12 },

    { name: "جبنة رومي مصنع", categoryIdx: 3, baseUnitName: "كرتونة", subUnitName: "قطعة", unitsPerBase: 10, purchasePricePerBase: 700, sellPricePerBase: 850, openingStockSub: 40, minStockQty: 10 },
    { name: "جبنة بيضاء قديمة", categoryIdx: 3, baseUnitName: "كرتونة", subUnitName: "علبة", unitsPerBase: 12, purchasePricePerBase: 480, sellPricePerBase: 588, openingStockSub: 36, minStockQty: 12 },
    { name: "زبادي المراعي", categoryIdx: 3, baseUnitName: "كرتونة", subUnitName: "علبة", unitsPerBase: 24, purchasePricePerBase: 168, sellPricePerBase: 216, openingStockSub: 72, minStockQty: 24 },
    { name: "لبن جهينة كامل الدسم 1 لتر", categoryIdx: 3, baseUnitName: "كرتونة", subUnitName: "كرتون", unitsPerBase: 12, purchasePricePerBase: 240, sellPricePerBase: 300, openingStockSub: 60, minStockQty: 24 },
    { name: "زبدة لورباك", categoryIdx: 3, baseUnitName: "كرتونة", subUnitName: "قطعة", unitsPerBase: 20, purchasePricePerBase: 900, sellPricePerBase: 1100, openingStockSub: 30, minStockQty: 10 },

    { name: "طماطم مقشرة معلبة", categoryIdx: 4, baseUnitName: "كرتونة", subUnitName: "علبة", unitsPerBase: 24, purchasePricePerBase: 288, sellPricePerBase: 360, openingStockSub: 96, minStockQty: 24 },
    { name: "فول مدمس معلب", categoryIdx: 4, baseUnitName: "كرتونة", subUnitName: "علبة", unitsPerBase: 24, purchasePricePerBase: 216, sellPricePerBase: 276, openingStockSub: 72, minStockQty: 24 },
    { name: "تونة معلبة", categoryIdx: 4, baseUnitName: "كرتونة", subUnitName: "علبة", unitsPerBase: 24, purchasePricePerBase: 720, sellPricePerBase: 900, openingStockSub: 48, minStockQty: 12 },
    { name: "ذرة معلبة", categoryIdx: 4, baseUnitName: "كرتونة", subUnitName: "علبة", unitsPerBase: 24, purchasePricePerBase: 216, sellPricePerBase: 276, openingStockSub: 60, minStockQty: 20 },

    { name: "شوكولاتة جالكسي", categoryIdx: 5, baseUnitName: "كرتونة", subUnitName: "علبة", unitsPerBase: 24, purchasePricePerBase: 480, sellPricePerBase: 600, openingStockSub: 48, minStockQty: 24 },
    { name: "بسكويت أوريو", categoryIdx: 5, baseUnitName: "كرتونة", subUnitName: "علبة", unitsPerBase: 24, purchasePricePerBase: 288, sellPricePerBase: 360, openingStockSub: 3, minStockQty: 24 },
    { name: "شيبسي ليز", categoryIdx: 5, baseUnitName: "كرتونة", subUnitName: "علبة", unitsPerBase: 30, purchasePricePerBase: 300, sellPricePerBase: 390, openingStockSub: 90, minStockQty: 30 },
    { name: "حلاوة طحينية", categoryIdx: 5, baseUnitName: "كرتونة", subUnitName: "علبة", unitsPerBase: 12, purchasePricePerBase: 240, sellPricePerBase: 300, openingStockSub: 24, minStockQty: 12 },

    { name: "طقم أواني تيفال", categoryIdx: 6, baseUnitName: "كرتونة", subUnitName: "قطعة", unitsPerBase: 4, purchasePricePerBase: 3200, sellPricePerBase: 3800, openingStockSub: 8, minStockQty: 4 },
    { name: "إسفنج جلي 5 قطع", categoryIdx: 6, baseUnitName: "كرتونة", subUnitName: "عبوة", unitsPerBase: 20, purchasePricePerBase: 200, sellPricePerBase: 260, openingStockSub: 40, minStockQty: 20 },
    { name: "شماعات غسيل", categoryIdx: 6, baseUnitName: "كرتونة", subUnitName: "عبوة", unitsPerBase: 12, purchasePricePerBase: 180, sellPricePerBase: 240, openingStockSub: 24, minStockQty: 12 },

    { name: "معجون أسنان سيجنال", categoryIdx: 7, baseUnitName: "كرتونة", subUnitName: "علبة", unitsPerBase: 24, purchasePricePerBase: 432, sellPricePerBase: 552, openingStockSub: 48, minStockQty: 24 },
    { name: "شامبو هيد اند شولدرز", categoryIdx: 7, baseUnitName: "كرتونة", subUnitName: "زجاجة", unitsPerBase: 12, purchasePricePerBase: 600, sellPricePerBase: 744, openingStockSub: 24, minStockQty: 12 },
    { name: "صابون لوكس", categoryIdx: 7, baseUnitName: "كرتونة", subUnitName: "قطعة", unitsPerBase: 48, purchasePricePerBase: 240, sellPricePerBase: 336, openingStockSub: 96, minStockQty: 48 },
    { name: "مزيل عرق دوف", categoryIdx: 7, baseUnitName: "كرتونة", subUnitName: "علبة", unitsPerBase: 12, purchasePricePerBase: 480, sellPricePerBase: 600, openingStockSub: 24, minStockQty: 12 },
  ];

  // pad to ~60 products with generic variants so the seed hits the PRD's target count
  const extraTemplates = [
    { name: "عصير فيمتو 235 مل", categoryIdx: 2, baseUnitName: "كرتونة", subUnitName: "علبة", unitsPerBase: 24, purchasePricePerBase: 168, sellPricePerBase: 216 },
    { name: "بسكويت لوتس", categoryIdx: 5, baseUnitName: "كرتونة", subUnitName: "علبة", unitsPerBase: 24, purchasePricePerBase: 264, sellPricePerBase: 336 },
    { name: "معلبات بازلاء", categoryIdx: 4, baseUnitName: "كرتونة", subUnitName: "علبة", unitsPerBase: 24, purchasePricePerBase: 216, sellPricePerBase: 276 },
    { name: "شامبو بانتين", categoryIdx: 7, baseUnitName: "كرتونة", subUnitName: "زجاجة", unitsPerBase: 12, purchasePricePerBase: 588, sellPricePerBase: 720 },
    { name: "سائل جلي غسيل أرضيات", categoryIdx: 1, baseUnitName: "كرتونة", subUnitName: "زجاجة", unitsPerBase: 12, purchasePricePerBase: 300, sellPricePerBase: 396 },
    { name: "أرز مصري بلدي 1 كجم", categoryIdx: 0, baseUnitName: "كرتونة", subUnitName: "كيس", unitsPerBase: 10, purchasePricePerBase: 400, sellPricePerBase: 480 },
    { name: "زيت دوار الشمس 1 لتر", categoryIdx: 0, baseUnitName: "كرتونة", subUnitName: "زجاجة", unitsPerBase: 12, purchasePricePerBase: 480, sellPricePerBase: 588 },
    { name: "مياه غازية سفن أب", categoryIdx: 2, baseUnitName: "كرتونة", subUnitName: "زجاجة", unitsPerBase: 12, purchasePricePerBase: 240, sellPricePerBase: 300 },
    { name: "جبنة تركية", categoryIdx: 3, baseUnitName: "كرتونة", subUnitName: "قطعة", unitsPerBase: 10, purchasePricePerBase: 650, sellPricePerBase: 800 },
    { name: "معلبات خوخ", categoryIdx: 4, baseUnitName: "كرتونة", subUnitName: "علبة", unitsPerBase: 24, purchasePricePerBase: 312, sellPricePerBase: 396 },
    { name: "شوكولاتة كيت كات", categoryIdx: 5, baseUnitName: "كرتونة", subUnitName: "علبة", unitsPerBase: 24, purchasePricePerBase: 432, sellPricePerBase: 552 },
    { name: "مناشف ورقية", categoryIdx: 6, baseUnitName: "كرتونة", subUnitName: "رول", unitsPerBase: 12, purchasePricePerBase: 240, sellPricePerBase: 312 },
    { name: "معجون أسنان كلوز أب", categoryIdx: 7, baseUnitName: "كرتونة", subUnitName: "علبة", unitsPerBase: 24, purchasePricePerBase: 408, sellPricePerBase: 516 },
    { name: "سكر ناعم 1 كجم", categoryIdx: 0, baseUnitName: "كرتونة", subUnitName: "كيس", unitsPerBase: 10, purchasePricePerBase: 390, sellPricePerBase: 470 },
    { name: "مسحوق غسيل بريل", categoryIdx: 1, baseUnitName: "كرتونة", subUnitName: "علبة", unitsPerBase: 6, purchasePricePerBase: 960, sellPricePerBase: 1140 },
    { name: "شاي ليبتون أصفر", categoryIdx: 2, baseUnitName: "كرتونة", subUnitName: "علبة", unitsPerBase: 24, purchasePricePerBase: 1080, sellPricePerBase: 1320 },
    { name: "قشطة المراعي", categoryIdx: 3, baseUnitName: "كرتونة", subUnitName: "علبة", unitsPerBase: 24, purchasePricePerBase: 240, sellPricePerBase: 300 },
    { name: "معلبات فاصوليا بيضاء", categoryIdx: 4, baseUnitName: "كرتونة", subUnitName: "علبة", unitsPerBase: 24, purchasePricePerBase: 240, sellPricePerBase: 300 },
    { name: "بسكويت شاي بيتي بيور", categoryIdx: 5, baseUnitName: "كرتونة", subUnitName: "علبة", unitsPerBase: 24, purchasePricePerBase: 216, sellPricePerBase: 276 },
    { name: "أدوات تنظيف زجاج", categoryIdx: 6, baseUnitName: "كرتونة", subUnitName: "زجاجة", unitsPerBase: 12, purchasePricePerBase: 216, sellPricePerBase: 288 },
    { name: "صابون ديتول", categoryIdx: 7, baseUnitName: "كرتونة", subUnitName: "قطعة", unitsPerBase: 48, purchasePricePerBase: 336, sellPricePerBase: 456 },
    { name: "مكرونة اسباجيتي", categoryIdx: 0, baseUnitName: "كرتونة", subUnitName: "علبة", unitsPerBase: 20, purchasePricePerBase: 220, sellPricePerBase: 280 },
  ];
  for (const t of extraTemplates) {
    productDefs.push({
      ...t,
      openingStockSub: randomInt(20, 200),
      minStockQty: randomInt(10, 30),
    });
  }

  type ProductWithState = Awaited<ReturnType<typeof prisma.product.create>> & {
    avgCostPerSub: Prisma.Decimal;
    def: (typeof productDefs)[number];
  };
  const products: ProductWithState[] = [];
  let skuCounter = 1000;
  let barcodeCounter = 6221000000001;
  for (const def of productDefs) {
    const avgCostPerSub = D(def.purchasePricePerBase).div(def.unitsPerBase);
    const product = await prisma.product.create({
      data: {
        sku: `SKU-${skuCounter++}`,
        barcode: String(barcodeCounter++),
        name: def.name,
        categoryId: categories[def.categoryIdx]!.id,
        baseUnitName: def.baseUnitName,
        subUnitName: def.subUnitName,
        unitsPerBase: D(def.unitsPerBase),
        purchasePricePerBase: D(def.purchasePricePerBase),
        sellPricePerBase: D(def.sellPricePerBase),
        avgCostPerSub,
        stockQty: D(def.openingStockSub),
        minStockQty: D(def.minStockQty),
        isActive: true,
      },
    });
    products.push({ ...product, avgCostPerSub, def });
  }
  // running per-product stock + avg cost, kept in lockstep with every StockMovement
  const productState = new Map(
    products.map((p) => [p.id, { stockQty: D(p.def.openingStockSub), avgCostPerSub: p.avgCostPerSub }]),
  );

  // opening StockMovement per product
  for (const p of products) {
    await prisma.stockMovement.create({
      data: {
        productId: p.id,
        type: "OPENING",
        qtyInSub: D(p.def.openingStockSub),
        balanceAfter: D(p.def.openingStockSub),
        unitCostPerSub: p.avgCostPerSub,
        refType: "OPENING",
        refId: p.id,
        createdById: systemUser.id,
        createdAt: daysAgo(90),
      },
    });
  }

  async function writeStockMovement(input: {
    productId: string;
    type: Prisma.StockMovementCreateInput["type"];
    qtyInSub: Prisma.Decimal; // signed
    unitCostPerSub: Prisma.Decimal;
    refType: string;
    refId: string;
    invoiceId?: string;
    note?: string;
    createdById: string;
    createdAt: Date;
    tx: Prisma.TransactionClient;
  }) {
    const state = productState.get(input.productId)!;
    const balanceAfter = state.stockQty.plus(input.qtyInSub);
    state.stockQty = balanceAfter;
    await input.tx.stockMovement.create({
      data: {
        productId: input.productId,
        type: input.type,
        qtyInSub: input.qtyInSub,
        balanceAfter,
        unitCostPerSub: input.unitCostPerSub,
        refType: input.refType,
        refId: input.refId,
        invoiceId: input.invoiceId,
        note: input.note,
        createdById: input.createdById,
        createdAt: input.createdAt,
      },
    });
    await input.tx.product.update({ where: { id: input.productId }, data: { stockQty: balanceAfter } });
  }

  // -- Customers / Suppliers ---------------------------------------------------
  const customerNames = [
    "محمد عبد الرحمن", "فاطمة الزهراء", "أحمد سيد", "منة الله كمال", "خالد إبراهيم",
    "نور الهدى محمود", "عمر حسن", "سلمى طارق", "يوسف عادل", "هبة الله فؤاد",
    "كريم منصور", "ياسمين شريف", "محمود عزت", "رانيا فتحي", "طارق عبد العزيز",
    "دينا وليد", "حسام الدين", "مروة أشرف", "شريف جمال", "أمل رجب",
  ];
  const customers = [];
  for (let i = 0; i < customerNames.length; i++) {
    const opening = i % 4 === 0 ? D(randomInt(200, 1500)) : D(0);
    const customer = await prisma.customer.create({
      data: {
        name: customerNames[i]!,
        phone: `010${randomInt(10000000, 99999999)}`,
        address: "المنصورة، الدقهلية",
        openingBalance: opening,
        balance: opening,
        isActive: true,
      },
    });
    customers.push(customer);
    if (opening.greaterThan(0)) {
      await prisma.partyTransaction.create({
        data: {
          partyType: "CUSTOMER",
          customerId: customer.id,
          type: "OPENING",
          debit: opening,
          credit: D(0),
          balanceAfter: opening,
          refType: "OPENING",
          refId: customer.id,
          occurredAt: daysAgo(90),
          createdById: systemUser.id,
          createdAt: daysAgo(90),
        },
      });
    }
  }
  const customerBalances = new Map(customers.map((c) => [c.id, c.balance]));

  const supplierNames = [
    "شركة النور للتجارة", "مؤسسة الأمل للتوزيع", "شركة الخليج للمواد الغذائية",
    "مصنع الصفا للمنظفات", "شركة المتحدة للاستيراد", "مؤسسة الرواد التجارية",
    "شركة الفجر للتوزيع", "مصنع الوفاء للألبان", "شركة السلام العامة", "مؤسسة البركة للتجارة",
  ];
  const suppliers = [];
  for (let i = 0; i < supplierNames.length; i++) {
    const opening = i % 3 === 0 ? D(randomInt(1000, 8000)) : D(0);
    const supplier = await prisma.supplier.create({
      data: {
        name: supplierNames[i]!,
        phone: `011${randomInt(10000000, 99999999)}`,
        address: "المنطقة الصناعية، المنصورة",
        openingBalance: opening,
        balance: opening,
        isActive: true,
      },
    });
    suppliers.push(supplier);
    if (opening.greaterThan(0)) {
      await prisma.partyTransaction.create({
        data: {
          partyType: "SUPPLIER",
          supplierId: supplier.id,
          type: "OPENING",
          debit: opening,
          credit: D(0),
          balanceAfter: opening,
          refType: "OPENING",
          refId: supplier.id,
          occurredAt: daysAgo(90),
          createdById: systemUser.id,
          createdAt: daysAgo(90),
        },
      });
    }
  }
  const supplierBalances = new Map(suppliers.map((s) => [s.id, s.balance]));

  async function writePartyTransaction(input: {
    partyType: "CUSTOMER" | "SUPPLIER";
    customerId?: string;
    supplierId?: string;
    type: Prisma.PartyTransactionCreateInput["type"];
    debit: Prisma.Decimal;
    credit: Prisma.Decimal;
    refType: string;
    refId: string;
    invoiceId?: string;
    occurredAt: Date;
    createdById: string;
    tx: Prisma.TransactionClient;
  }) {
    const map = input.partyType === "CUSTOMER" ? customerBalances : supplierBalances;
    const key = (input.partyType === "CUSTOMER" ? input.customerId : input.supplierId)!;
    const current = map.get(key)!;
    const balanceAfter = current.plus(input.debit).minus(input.credit);
    map.set(key, balanceAfter);
    await input.tx.partyTransaction.create({
      data: {
        partyType: input.partyType,
        customerId: input.customerId,
        supplierId: input.supplierId,
        type: input.type,
        debit: input.debit,
        credit: input.credit,
        balanceAfter,
        refType: input.refType,
        refId: input.refId,
        invoiceId: input.invoiceId,
        occurredAt: input.occurredAt,
        createdById: input.createdById,
        createdAt: input.occurredAt,
      },
    });
    if (input.partyType === "CUSTOMER") {
      await input.tx.customer.update({ where: { id: key }, data: { balance: balanceAfter } });
    } else {
      await input.tx.supplier.update({ where: { id: key }, data: { balance: balanceAfter } });
    }
  }

  // -- Document counters --------------------------------------------------
  const counters: Record<string, number> = { SALE: 0, PURCHASE: 0, SALE_RETURN: 0, PURCHASE_RETURN: 0, COLLECTION: 0, PAYMENT: 0, STOCKTAKE: 0 };
  function nextNumber(type: keyof typeof counters): number {
    counters[type] = counters[type]! + 1;
    return counters[type]!;
  }

  const nowUser = () => pick(users);

  // -- Purchases (confirmed, spread over 90 days, updates avg cost) -----------
  const purchaseInvoiceIds: string[] = [];
  const purchaseCount = 28;
  for (let i = 0; i < purchaseCount; i++) {
    const day = randomInt(1, 89);
    const issuedAt = daysAgo(day);
    const supplier = pick(suppliers);
    const cashbox = pick(cashboxes);
    const createdBy = nowUser();
    const lineCount = randomInt(2, 5);
    const chosenProducts = new Set<string>();
    while (chosenProducts.size < lineCount) chosenProducts.add(pick(products).id);

    await seedTransaction(async (tx) => {
      let subtotal = D(0);
      const lineData: Prisma.InvoiceLineCreateManyInvoiceInput[] = [];
      const stockUpdates: { productId: string; qtyInSub: Prisma.Decimal; unitCostPerSub: Prisma.Decimal }[] = [];

      for (const productId of chosenProducts) {
        const product = products.find((p) => p.id === productId)!;
        const qtyBase = D(randomInt(2, 15));
        const qtyInSub = qtyBase.times(product.def.unitsPerBase);
        const unitPrice = D(product.def.purchasePricePerBase);
        const lineTotal = qtyBase.times(unitPrice);
        subtotal = subtotal.plus(lineTotal);

        const state = productState.get(productId)!;
        const newAvgCost = state.stockQty
          .times(state.avgCostPerSub)
          .plus(qtyInSub.times(unitPrice.div(product.def.unitsPerBase)))
          .div(state.stockQty.plus(qtyInSub));

        lineData.push({
          productId,
          productName: product.name,
          unitName: product.def.baseUnitName,
          unitType: "BASE",
          unitsPerBaseSnapshot: D(product.def.unitsPerBase),
          qtyInUnit: qtyBase,
          qtyInSub,
          unitPrice,
          lineTotal,
          costPerSubAtSale: state.avgCostPerSub,
          sortOrder: lineData.length,
        });

        stockUpdates.push({ productId, qtyInSub, unitCostPerSub: unitPrice.div(product.def.unitsPerBase) });
        state.avgCostPerSub = newAvgCost;
        await tx.product.update({ where: { id: productId }, data: { avgCostPerSub: newAvgCost } });
        product.avgCostPerSub = newAvgCost;
      }

      const discountAmount = D(0);
      const total = subtotal.minus(discountAmount);
      const isPaid = Math.random() > 0.3;
      const paidAmount = isPaid ? total : total.times(D(randomInt(30, 70)).div(100)).toDecimalPlaces(2);
      const remainingAmount = total.minus(paidAmount);
      const paymentStatus = remainingAmount.equals(0) ? "PAID" : paidAmount.equals(0) ? "UNPAID" : "PARTIAL";
      const number = nextNumber("PURCHASE");

      const invoice = await tx.invoice.create({
        data: {
          number,
          type: "PURCHASE",
          status: "CONFIRMED",
          paymentStatus,
          supplierId: supplier.id,
          cashboxId: cashbox.id,
          subtotal,
          discountAmount,
          total,
          paidAmount,
          remainingAmount,
          issuedAt,
          createdById: createdBy.id,
          createdAt: issuedAt,
          lines: { createMany: { data: lineData } },
        },
      });
      purchaseInvoiceIds.push(invoice.id);

      for (const su of stockUpdates) {
        await writeStockMovement({
          productId: su.productId,
          type: "PURCHASE",
          qtyInSub: su.qtyInSub,
          unitCostPerSub: su.unitCostPerSub,
          refType: "INVOICE",
          refId: invoice.id,
          invoiceId: invoice.id,
          createdById: createdBy.id,
          createdAt: issuedAt,
          tx,
        });
      }

      if (paidAmount.greaterThan(0)) {
        await writeCashMovement({
          cashboxId: cashbox.id,
          type: "PURCHASE_PAYMENT",
          amount: paidAmount.negated(),
          refType: "INVOICE",
          refId: invoice.id,
          invoiceId: invoice.id,
          supplierId: supplier.id,
          createdById: createdBy.id,
          createdAt: issuedAt,
          tx,
        });
      }
      if (remainingAmount.greaterThan(0)) {
        await writePartyTransaction({
          partyType: "SUPPLIER",
          supplierId: supplier.id,
          type: "INVOICE",
          debit: remainingAmount,
          credit: D(0),
          refType: "INVOICE",
          refId: invoice.id,
          invoiceId: invoice.id,
          occurredAt: issuedAt,
          createdById: createdBy.id,
          tx,
        });
      }

      await tx.auditLog.create({
        data: {
          userId: createdBy.id,
          action: "purchase.create",
          entityType: "Invoice",
          entityId: invoice.id,
          entityLabel: `فاتورة شراء #${String(number).padStart(6, "0")}`,
          afterJson: { total: total.toString(), paidAmount: paidAmount.toString() },
          createdAt: issuedAt,
        },
      });
    });
  }

  // -- Sales (confirmed, spread over 90 days, freezes cost at sale) -----------
  const saleInvoices: { id: string; number: number; customerId: string; issuedAt: Date }[] = [];
  const saleCount = 44;
  for (let i = 0; i < saleCount; i++) {
    const day = randomInt(0, 88);
    const issuedAt = daysAgo(day);
    const customer = Math.random() > 0.15 ? pick(customers) : null;
    const cashbox = pick(cashboxes);
    const createdBy = nowUser();
    const lineCount = randomInt(1, 6);
    const chosenProducts = new Set<string>();
    let attempts = 0;
    while (chosenProducts.size < lineCount && attempts < 30) {
      const candidate = pick(products);
      if (productState.get(candidate.id)!.stockQty.greaterThan(5)) chosenProducts.add(candidate.id);
      attempts++;
    }
    if (chosenProducts.size === 0) continue;

    await seedTransaction(async (tx) => {
      let subtotal = D(0);
      const lineData: Prisma.InvoiceLineCreateManyInvoiceInput[] = [];
      const stockUpdates: { productId: string; qtyInSub: Prisma.Decimal; unitCostPerSub: Prisma.Decimal }[] = [];

      for (const productId of chosenProducts) {
        const product = products.find((p) => p.id === productId)!;
        const state = productState.get(productId)!;
        const maxQty = Math.min(state.stockQty.toNumber(), product.def.unitsPerBase * 3);
        const qtyInSub = D(Math.max(1, Math.min(maxQty, randomInt(1, product.def.unitsPerBase * 2))));
        if (qtyInSub.greaterThan(state.stockQty)) continue;

        const unitPricePerSub = D(product.def.sellPricePerBase).div(product.def.unitsPerBase);
        const lineTotal = qtyInSub.times(unitPricePerSub).toDecimalPlaces(2);
        subtotal = subtotal.plus(lineTotal);

        lineData.push({
          productId,
          productName: product.name,
          unitName: product.def.subUnitName,
          unitType: "SUB",
          unitsPerBaseSnapshot: D(product.def.unitsPerBase),
          qtyInUnit: qtyInSub,
          qtyInSub,
          unitPrice: unitPricePerSub,
          lineTotal,
          costPerSubAtSale: state.avgCostPerSub,
          sortOrder: lineData.length,
        });

        stockUpdates.push({ productId, qtyInSub: qtyInSub.negated(), unitCostPerSub: state.avgCostPerSub });
      }
      if (lineData.length === 0) return;

      const discountAmount = Math.random() > 0.7 ? subtotal.times(D(randomInt(2, 8)).div(100)).toDecimalPlaces(2) : D(0);
      const total = subtotal.minus(discountAmount);
      const isPaid = !customer || Math.random() > 0.35;
      const paidAmount = isPaid ? total : total.times(D(randomInt(0, 60)).div(100)).toDecimalPlaces(2);
      const remainingAmount = total.minus(paidAmount);
      const paymentStatus = remainingAmount.equals(0) ? "PAID" : paidAmount.equals(0) ? "UNPAID" : "PARTIAL";
      const number = nextNumber("SALE");

      const invoice = await tx.invoice.create({
        data: {
          number,
          type: "SALE",
          status: "CONFIRMED",
          paymentStatus,
          customerId: customer?.id,
          cashboxId: cashbox.id,
          subtotal,
          discountAmount,
          total,
          paidAmount,
          remainingAmount,
          issuedAt,
          createdById: createdBy.id,
          createdAt: issuedAt,
          lines: { createMany: { data: lineData } },
        },
      });
      saleInvoices.push({ id: invoice.id, number, customerId: customer?.id ?? "", issuedAt });

      for (const su of stockUpdates) {
        await writeStockMovement({
          productId: su.productId,
          type: "SALE",
          qtyInSub: su.qtyInSub,
          unitCostPerSub: su.unitCostPerSub,
          refType: "INVOICE",
          refId: invoice.id,
          invoiceId: invoice.id,
          createdById: createdBy.id,
          createdAt: issuedAt,
          tx,
        });
      }

      if (paidAmount.greaterThan(0)) {
        await writeCashMovement({
          cashboxId: cashbox.id,
          type: "SALE_PAYMENT",
          amount: paidAmount,
          refType: "INVOICE",
          refId: invoice.id,
          invoiceId: invoice.id,
          customerId: customer?.id,
          createdById: createdBy.id,
          createdAt: issuedAt,
          tx,
        });
      }
      if (remainingAmount.greaterThan(0) && customer) {
        await writePartyTransaction({
          partyType: "CUSTOMER",
          customerId: customer.id,
          type: "INVOICE",
          debit: remainingAmount,
          credit: D(0),
          refType: "INVOICE",
          refId: invoice.id,
          invoiceId: invoice.id,
          occurredAt: issuedAt,
          createdById: createdBy.id,
          tx,
        });
      }

      await tx.auditLog.create({
        data: {
          userId: createdBy.id,
          action: "sale.create",
          entityType: "Invoice",
          entityId: invoice.id,
          entityLabel: `فاتورة بيع #${String(number).padStart(6, "0")}`,
          afterJson: { total: total.toString(), paidAmount: paidAmount.toString() },
          createdAt: issuedAt,
        },
      });
    });
  }

  // -- A few sales returns against real sale invoices --------------------------
  const returnableSales = saleInvoices.filter((s) => s.customerId).slice(0, 6);
  for (const original of returnableSales) {
    const originalFull = await prisma.invoice.findUnique({ where: { id: original.id }, include: { lines: true } });
    if (!originalFull || originalFull.lines.length === 0) continue;
    const line = originalFull.lines[0]!;
    const returnQty = line.qtyInSub.lessThan(2) ? line.qtyInSub : line.qtyInSub.div(2).toDecimalPlaces(0, Prisma.Decimal.ROUND_DOWN);
    if (returnQty.lessThanOrEqualTo(0)) continue;

    const returnDate = new Date(original.issuedAt.getTime() + 1000 * 60 * 60 * 24 * randomInt(1, 5));
    const createdBy = nowUser();

    await seedTransaction(async (tx) => {
      const lineTotal = returnQty.times(line.unitPrice).toDecimalPlaces(2);
      const number = nextNumber("SALE_RETURN");
      const state = productState.get(line.productId)!;

      const invoice = await tx.invoice.create({
        data: {
          number,
          type: "SALE_RETURN",
          status: "CONFIRMED",
          paymentStatus: "PAID",
          customerId: originalFull.customerId,
          cashboxId: originalFull.cashboxId,
          subtotal: lineTotal,
          discountAmount: D(0),
          total: lineTotal,
          paidAmount: lineTotal,
          remainingAmount: D(0),
          issuedAt: returnDate,
          createdById: createdBy.id,
          createdAt: returnDate,
          originalInvoiceId: originalFull.id,
          lines: {
            create: {
              productId: line.productId,
              productName: line.productName,
              unitName: line.unitName,
              unitType: line.unitType,
              unitsPerBaseSnapshot: line.unitsPerBaseSnapshot,
              qtyInUnit: returnQty,
              qtyInSub: returnQty,
              unitPrice: line.unitPrice,
              lineTotal,
              costPerSubAtSale: line.costPerSubAtSale,
              sortOrder: 0,
            },
          },
        },
      });

      await writeStockMovement({
        productId: line.productId,
        type: "SALE_RETURN",
        qtyInSub: returnQty,
        unitCostPerSub: state.avgCostPerSub,
        refType: "INVOICE",
        refId: invoice.id,
        invoiceId: invoice.id,
        createdById: createdBy.id,
        createdAt: returnDate,
        tx,
      });

      await writeCashMovement({
        cashboxId: originalFull.cashboxId,
        type: "SALE_RETURN_REFUND",
        amount: lineTotal.negated(),
        refType: "INVOICE",
        refId: invoice.id,
        invoiceId: invoice.id,
        customerId: originalFull.customerId ?? undefined,
        createdById: createdBy.id,
        createdAt: returnDate,
        tx,
      });

      await tx.auditLog.create({
        data: {
          userId: createdBy.id,
          action: "return.create",
          entityType: "Invoice",
          entityId: invoice.id,
          entityLabel: `مرتجع بيع #${String(number).padStart(6, "0")}`,
          afterJson: { total: lineTotal.toString() },
          createdAt: returnDate,
        },
      });
    });
  }

  // -- Collections (قبض) against customers with a balance ----------------------
  const debtorCustomers = customers.filter((c) => customerBalances.get(c.id)!.greaterThan(0));
  for (const customer of debtorCustomers.slice(0, 8)) {
    const balance = customerBalances.get(customer.id)!;
    const amount = balance.times(D(randomInt(20, 60)).div(100)).toDecimalPlaces(2);
    if (amount.lessThanOrEqualTo(0)) continue;
    const cashbox = pick(cashboxes);
    const createdBy = nowUser();
    const occurredAt = daysAgo(randomInt(1, 30));

    await seedTransaction(async (tx) => {
      const number = nextNumber("COLLECTION");
      const collection = await tx.collection.create({
        data: {
          number,
          customerId: customer.id,
          cashboxId: cashbox.id,
          amount,
          occurredAt,
          status: "CONFIRMED",
          createdById: createdBy.id,
          createdAt: occurredAt,
        },
      });

      await writeCashMovement({
        cashboxId: cashbox.id,
        type: "CUSTOMER_COLLECTION",
        amount,
        refType: "COLLECTION",
        refId: collection.id,
        customerId: customer.id,
        createdById: createdBy.id,
        createdAt: occurredAt,
        tx,
      });

      await writePartyTransaction({
        partyType: "CUSTOMER",
        customerId: customer.id,
        type: "PAYMENT",
        debit: D(0),
        credit: amount,
        refType: "COLLECTION",
        refId: collection.id,
        occurredAt,
        createdById: createdBy.id,
        tx,
      });

      await tx.auditLog.create({
        data: {
          userId: createdBy.id,
          action: "collection.create",
          entityType: "Collection",
          entityId: collection.id,
          entityLabel: `تحصيل #${String(number).padStart(6, "0")}`,
          afterJson: { amount: amount.toString() },
          createdAt: occurredAt,
        },
      });
    });
  }

  // -- Payments (صرف) against suppliers with a balance -------------------------
  const owedSuppliers = suppliers.filter((s) => supplierBalances.get(s.id)!.greaterThan(0));
  for (const supplier of owedSuppliers) {
    const balance = supplierBalances.get(supplier.id)!;
    const amount = balance.times(D(randomInt(20, 60)).div(100)).toDecimalPlaces(2);
    if (amount.lessThanOrEqualTo(0)) continue;
    const cashbox = pick(cashboxes);
    const createdBy = nowUser();
    const occurredAt = daysAgo(randomInt(1, 30));

    await seedTransaction(async (tx) => {
      const number = nextNumber("PAYMENT");
      const payment = await tx.payment.create({
        data: {
          number,
          supplierId: supplier.id,
          cashboxId: cashbox.id,
          amount,
          occurredAt,
          status: "CONFIRMED",
          createdById: createdBy.id,
          createdAt: occurredAt,
        },
      });

      await writeCashMovement({
        cashboxId: cashbox.id,
        type: "SUPPLIER_PAYMENT",
        amount: amount.negated(),
        refType: "PAYMENT",
        refId: payment.id,
        supplierId: supplier.id,
        createdById: createdBy.id,
        createdAt: occurredAt,
        tx,
      });

      await writePartyTransaction({
        partyType: "SUPPLIER",
        supplierId: supplier.id,
        type: "PAYMENT",
        debit: D(0),
        credit: amount,
        refType: "PAYMENT",
        refId: payment.id,
        occurredAt,
        createdById: createdBy.id,
        tx,
      });

      await tx.auditLog.create({
        data: {
          userId: createdBy.id,
          action: "payment.create",
          entityType: "Payment",
          entityId: payment.id,
          entityLabel: `دفعة #${String(number).padStart(6, "0")}`,
          afterJson: { amount: amount.toString() },
          createdAt: occurredAt,
        },
      });
    });
  }

  // -- One confirmed stocktake, adjusting a handful of products ----------------
  await seedTransaction(async (tx) => {
    const number = nextNumber("STOCKTAKE");
    const confirmedAt = daysAgo(2);
    const stocktakeProducts = products.slice(0, 6);

    const stocktake = await tx.stocktake.create({
      data: {
        number,
        status: "CONFIRMED",
        note: "جرد دوري شهري",
        createdById: adminUser.id,
        confirmedAt,
        createdAt: confirmedAt,
      },
    });

    for (const p of stocktakeProducts) {
      const state = productState.get(p.id)!;
      const systemQty = state.stockQty;
      const diff = D(randomInt(-3, 3));
      const countedQty = systemQty.plus(diff);

      await tx.stocktakeLine.create({
        data: {
          stocktakeId: stocktake.id,
          productId: p.id,
          systemQtyInSub: systemQty,
          countedQtyInSub: countedQty,
          differenceInSub: diff,
        },
      });

      if (!diff.equals(0)) {
        await writeStockMovement({
          productId: p.id,
          type: "STOCKTAKE",
          qtyInSub: diff,
          unitCostPerSub: state.avgCostPerSub,
          refType: "STOCKTAKE",
          refId: stocktake.id,
          createdById: adminUser.id,
          createdAt: confirmedAt,
          tx,
        });
      }
    }

    await tx.auditLog.create({
      data: {
        userId: adminUser.id,
        action: "stocktake.confirm",
        entityType: "Stocktake",
        entityId: stocktake.id,
        entityLabel: `جرد #${String(number).padStart(6, "0")}`,
        afterJson: { lineCount: stocktakeProducts.length },
        createdAt: confirmedAt,
      },
    });
  });

  // -- Document counters ---------------------------------------------------
  await prisma.documentCounter.createMany({
    data: Object.entries(counters).map(([type, lastNumber]) => ({ type, lastNumber })),
  });

  // -- Notifications (low/out of stock, derived from final product state) -----
  const refreshedProducts = await prisma.product.findMany();
  const notificationData: Prisma.NotificationCreateManyInput[] = [];
  for (const p of refreshedProducts) {
    if (p.stockQty.lessThanOrEqualTo(0)) {
      notificationData.push({
        type: "OUT_OF_STOCK",
        severity: "CRITICAL",
        titleKey: "outOfStock",
        bodyParams: { name: p.name, stock: p.stockQty.toString(), min: p.minStockQty.toString(), unit: p.subUnitName },
        entityType: "Product",
        entityId: p.id,
        dedupeKey: `stock:${p.id}`,
        createdAt: daysAgo(0),
      });
    } else if (p.stockQty.lessThan(p.minStockQty)) {
      notificationData.push({
        type: "LOW_STOCK",
        severity: "WARNING",
        titleKey: "lowStock",
        bodyParams: { name: p.name, stock: p.stockQty.toString(), min: p.minStockQty.toString(), unit: p.subUnitName },
        entityType: "Product",
        entityId: p.id,
        dedupeKey: `stock:${p.id}`,
        createdAt: daysAgo(0),
      });
    }
  }
  const highBalanceCustomers = await prisma.customer.findMany({ where: { balance: { gt: 1000 } } });
  for (const c of highBalanceCustomers) {
    notificationData.push({
      type: "CUSTOMER_BALANCE",
      severity: "INFO",
      titleKey: "customerBalance",
      bodyParams: { name: c.name, balance: c.balance.toString() },
      entityType: "Customer",
      entityId: c.id,
      dedupeKey: `customer-balance:${c.id}`,
      createdAt: daysAgo(0),
    });
  }
  if (notificationData.length > 0) {
    await prisma.notification.createMany({ data: notificationData });
  }

  // -- Reconciliation check (must hold for the seed to be considered valid) ----
  const finalCashboxes = await prisma.cashbox.findMany();
  for (const c of finalCashboxes) {
    const sum = await prisma.cashMovement.aggregate({ where: { cashboxId: c.id }, _sum: { amount: true } });
    const expected = c.openingBalance.plus(sum._sum.amount ?? D(0));
    if (!expected.equals(c.balance)) {
      throw new Error(`Cashbox ${c.name} balance mismatch: stored ${c.balance}, expected ${expected}`);
    }
  }
  // Note: the OPENING PartyTransaction row already carries `openingBalance` into the ledger sum
  // (mirrors how StockMovement has its own OPENING row) — so `balance == opening + Σ(ledger)` collapses
  // to `balance == Σ(ledger)` here, not `opening + Σ(ledger)`, which would double the opening amount.
  const finalCustomers = await prisma.customer.findMany();
  for (const c of finalCustomers) {
    const sum = await prisma.partyTransaction.aggregate({ where: { customerId: c.id }, _sum: { debit: true, credit: true } });
    const expected = (sum._sum.debit ?? D(0)).minus(sum._sum.credit ?? D(0));
    if (!expected.equals(c.balance)) {
      throw new Error(`Customer ${c.name} balance mismatch: stored ${c.balance}, expected ${expected}`);
    }
  }
  const finalSuppliers = await prisma.supplier.findMany();
  for (const s of finalSuppliers) {
    const sum = await prisma.partyTransaction.aggregate({ where: { supplierId: s.id }, _sum: { debit: true, credit: true } });
    const expected = (sum._sum.debit ?? D(0)).minus(sum._sum.credit ?? D(0));
    if (!expected.equals(s.balance)) {
      throw new Error(`Supplier ${s.name} balance mismatch: stored ${s.balance}, expected ${expected}`);
    }
  }
  const finalProducts = await prisma.product.findMany();
  for (const p of finalProducts) {
    const sum = await prisma.stockMovement.aggregate({ where: { productId: p.id }, _sum: { qtyInSub: true } });
    const expected = sum._sum.qtyInSub ?? D(0);
    if (!expected.equals(p.stockQty)) {
      throw new Error(`Product ${p.name} stock mismatch: stored ${p.stockQty}, expected ${expected}`);
    }
  }

  console.log("Seed complete and reconciled:");
  console.log(`  roles=3 users=${users.length} categories=${categories.length} products=${products.length}`);
  console.log(`  customers=${customers.length} suppliers=${suppliers.length} cashboxes=${cashboxes.length}`);
  console.log(`  purchases=${purchaseInvoiceIds.length} sales=${saleInvoices.length} returns=${returnableSales.length}`);
  console.log(`  collections=${debtorCustomers.slice(0, 8).length} payments=${owedSuppliers.length}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
