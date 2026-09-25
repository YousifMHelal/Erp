import { z } from "zod";
import { decimal, lineAmount } from "@/lib/money";
import messages from "@/messages/ar.json";

const v = messages.validation;
export const egyptPhoneSchema = z.string().trim().regex(/^01[0125][0-9]{8}$/, v.phone);
const moneyText = z
  .string()
  .trim()
  .regex(/^(?:0|[1-9]\d{0,11})(?:\.\d{1,2})?$/, v.invalid);
const priceText = z
  .string()
  .trim()
  .regex(/^(?:0|[1-9]\d{0,9})(?:\.\d{1,4})?$/, v.invalid);
const quantityText = z
  .string()
  .trim()
  .regex(/^(?:0|[1-9]\d{0,13})(?:\.\d{1,4})?$/, v.invalid);
const positiveMoney = moneyText.refine(
  (amount) => Number(amount) > 0,
  v.positive,
);
const positivePrice = priceText.refine(
  (amount) => Number(amount) > 0,
  v.positive,
);
const positiveQuantity = quantityText.refine(
  (amount) => Number(amount) > 0,
  v.positive,
);
const unitRatioText = z.string().trim().regex(/^[1-9]\d{0,13}$/, v.positive);
const optionalId = z
  .string()
  .trim()
  .min(1, v.required)
  .max(80, v.long)
  .optional();
const optionalNote = z.string().trim().max(1000, v.long).optional();
const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, v.date)
  .refine((value) => {
    const parsed = new Date(`${value}T00:00:00Z`);
    return (
      !Number.isNaN(parsed.getTime()) && parsed.toISOString().startsWith(value)
    );
  }, v.date);

export const loginSchema = z
  .object({
    username: z.string().trim().min(1, v.required).max(80, v.long).optional(),
    userId: z.string().trim().min(1, v.required).max(80, v.long).optional(),
  password: z.string().min(1, v.required).max(200, v.long),
  })
  .refine(
    (credentials) =>
      Boolean(credentials.username) !== Boolean(credentials.userId),
    v.invalid,
  );

export const createUserSchema = z
  .object({
    username: z
      .string()
      .trim()
      .min(3, v.short)
      .max(80, v.long)
      .regex(/^[a-zA-Z][a-zA-Z0-9._-]*$/, v.invalid),
    displayName: z.string().trim().min(2, v.short).max(120, v.long),
    roleId: z.string().trim().min(1, v.required).max(80, v.long),
    password: z
      .string()
      .min(8, v.short)
      .max(72, v.long)
      .regex(/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9])/, v.password),
    confirmPassword: z.string().min(1, v.required).max(72, v.long),
    isActive: z.boolean(),
  })
  .refine((user) => user.password === user.confirmPassword, {
    path: ["confirmPassword"],
    message: v.passwordMatch,
  });

export const productIdSchema = z.string().trim().min(1, v.required).max(80, v.long);

export const productSchema = z.object({
  sku: z.string().trim().min(1, v.required).max(80, v.long),
  barcode: z
    .string()
    .trim()
    .regex(/^\d{8,14}$/, v.invalid)
    .optional()
    .or(z.literal("")),
  name: z.string().trim().min(2, v.short).max(200, v.long),
  categoryId: optionalId,
  baseUnitName: z.string().trim().min(1, v.required).max(50, v.long),
  subUnitName: z.string().trim().min(1, v.required).max(50, v.long),
  unitsPerBase: unitRatioText,
  purchasePricePerBase: moneyText,
  sellPricePerBase: positiveMoney,
  minStockQty: quantityText,
  notes: optionalNote,
  isActive: z.boolean(),
});

export const saleLineSchema = z.object({
  productId: z.string().trim().min(1, v.required).max(80, v.long),
  unitType: z.enum(["BASE", "SUB"]),
  qtyInUnit: positiveQuantity,
  unitPrice: positivePrice,
});

const saleFieldsSchema = z.object({
  customerId: optionalId,
  cashboxId: z.string().trim().min(1, v.required).max(80, v.long),
  lines: z.array(saleLineSchema).min(1, v.lines).max(200, v.long),
  discountAmount: moneyText,
  paidAmount: moneyText,
  notes: optionalNote,
  issuedAt: isoDate.optional(),
});

function checkSaleAmounts(sale: z.infer<typeof saleFieldsSchema>, context: z.RefinementCtx) {
  const subtotal = sale.lines.reduce(
    (sum, line) => sum.plus(lineAmount(line.qtyInUnit, line.unitPrice)), decimal(0),
  );
  const total = subtotal.minus(sale.discountAmount);
  const paid = decimal(sale.paidAmount);
  if (total.lt(0)) context.addIssue({ code: "custom", path: ["discountAmount"], message: messages.salesAction.discount });
  if (paid.gt(total)) context.addIssue({ code: "custom", path: ["paidAmount"], message: messages.salesAction.paid });
  if (total.minus(paid).gt(0) && !sale.customerId) {
    context.addIssue({ code: "custom", path: ["customerId"], message: v.customerCredit });
  }
}

/** Set on documents created offline; a retried sync with the same id returns the original instead of duplicating it. */
const clientRequestId = z.string().uuid().optional();

export const createSaleSchema = saleFieldsSchema.extend({ clientRequestId }).superRefine(checkSaleAmounts);

export const updateSaleSchema = saleFieldsSchema.extend({
  id: z.string().trim().min(1, v.required).max(80, v.long),
  updatedAt: z.coerce.date(),
}).superRefine(checkSaleAmounts);

export const cancelSaleSchema = z.object({
  id: z.string().trim().min(1, v.required).max(80, v.long),
  reason: z.string().trim().max(500, v.long).optional().transform((value) => value || undefined),
});

export const saleIdSchema = z
  .string()
  .trim()
  .min(1, v.required)
  .max(80, v.long);

const purchaseFieldsSchema = z.object({
  supplierId: optionalId,
  cashboxId: z.string().trim().min(1, v.required).max(80, v.long),
  lines: z.array(saleLineSchema).min(1, v.lines).max(200, v.long),
  discountAmount: moneyText,
  paidAmount: moneyText,
  notes: optionalNote,
  issuedAt: isoDate.optional(),
});

function checkPurchaseAmounts(
  purchase: z.infer<typeof purchaseFieldsSchema>,
  context: z.RefinementCtx,
) {
  const subtotal = purchase.lines.reduce(
    (sum, line) => sum.plus(lineAmount(line.qtyInUnit, line.unitPrice)), decimal(0),
  );
  const total = subtotal.minus(purchase.discountAmount);
  const paid = decimal(purchase.paidAmount);
  if (total.lt(0)) context.addIssue({ code: "custom", path: ["discountAmount"], message: messages.salesAction.discount });
  if (paid.gt(total)) context.addIssue({ code: "custom", path: ["paidAmount"], message: messages.salesAction.paid });
  if (total.minus(paid).gt(0) && !purchase.supplierId) {
    context.addIssue({ code: "custom", path: ["supplierId"], message: v.supplierCredit });
  }
}

export const createPurchaseSchema = purchaseFieldsSchema.extend({ clientRequestId }).superRefine(checkPurchaseAmounts);

export const updatePurchaseSchema = purchaseFieldsSchema.extend({
  id: z.string().trim().min(1, v.required).max(80, v.long),
  updatedAt: z.coerce.date(),
}).superRefine(checkPurchaseAmounts);

export const cancelPurchaseSchema = z.object({
  id: z.string().trim().min(1, v.required).max(80, v.long),
  reason: z.string().trim().max(500, v.long).optional().transform((value) => value || undefined),
});

export const purchaseIdSchema = z
  .string()
  .trim()
  .min(1, v.required)
  .max(80, v.long);

export const purchasesFilterSchema = z
  .object({
    q: z.string().trim().max(100, v.long).optional(),
    from: isoDate.optional(),
    to: isoDate.optional(),
    supplierId: optionalId,
    cashboxId: optionalId,
    paymentStatus: z.enum(["PAID", "PARTIAL", "UNPAID"]).optional(),
    userId: optionalId,
    sortBy: z.enum(["issuedAt", "number", "total"]).default("issuedAt"),
    sortDirection: z.enum(["asc", "desc"]).default("desc"),
    page: z.coerce.number().int().positive().max(100000).default(1),
    pageSize: z.coerce.number().int().positive().max(100).default(20),
  })
  .refine(
    (filters) => !filters.from || !filters.to || filters.from <= filters.to,
    {
      path: ["to"],
      message: v.dateRange,
    },
  );

export const productSearchSchema = z.string().trim().max(100, v.long);
export const priceSuggestionSchema = z.object({
  productId: z.string().trim().min(1, v.required).max(80, v.long),
  customerId: optionalId,
});

export const salesFilterSchema = z
  .object({
    q: z.string().trim().max(100, v.long).optional(),
    from: isoDate.optional(),
    to: isoDate.optional(),
    customerId: optionalId,
    cashboxId: optionalId,
    paymentStatus: z.enum(["PAID", "PARTIAL", "UNPAID"]).optional(),
    userId: optionalId,
    sortBy: z.enum(["issuedAt", "number", "total"]).default("issuedAt"),
    sortDirection: z.enum(["asc", "desc"]).default("desc"),
    page: z.coerce.number().int().positive().max(100000).default(1),
    pageSize: z.coerce.number().int().positive().max(100).default(20),
  })
  .refine(
    (filters) => !filters.from || !filters.to || filters.from <= filters.to,
    {
      path: ["to"],
      message: v.dateRange,
    },
  );

export const returnLineSchema = z.object({
  productId: z.string().trim().min(1, v.required).max(80, v.long),
  qtyInSub: positiveQuantity,
});

export const createReturnSchema = z.object({
  originalInvoiceId: z.string().trim().min(1, v.required).max(80, v.long),
  cashboxId: z.string().trim().min(1, v.required).max(80, v.long),
  settleFromCashbox: z.boolean(),
  lines: z.array(returnLineSchema).min(1, v.lines).max(200, v.long),
  notes: optionalNote,
});

export const cancelReturnSchema = z.object({
  id: z.string().trim().min(1, v.required).max(80, v.long),
  reason: z.string().trim().max(500, v.long).optional().transform((value) => value || undefined),
});

export const returnIdSchema = z.string().trim().min(1, v.required).max(80, v.long);

export const returnsFilterSchema = z
  .object({
    q: z.string().trim().max(100, v.long).optional(),
    from: isoDate.optional(),
    to: isoDate.optional(),
    partyId: optionalId,
    cashboxId: optionalId,
    sortBy: z.enum(["issuedAt", "number", "total"]).default("issuedAt"),
    sortDirection: z.enum(["asc", "desc"]).default("desc"),
    page: z.coerce.number().int().positive().max(100000).default(1),
    pageSize: z.coerce.number().int().positive().max(100).default(20),
  })
  .refine(
    (filters) => !filters.from || !filters.to || filters.from <= filters.to,
    { path: ["to"], message: v.dateRange },
  );

export const originalInvoiceLinesSchema = z
  .string()
  .trim()
  .min(1, v.required)
  .max(80, v.long);

export const stocktakeLineSchema = z.object({
  productId: z.string().trim().min(1, v.required).max(80, v.long),
  countedQty: quantityText,
});

export const confirmStocktakeSchema = z.object({
  note: optionalNote,
  lines: z.array(stocktakeLineSchema).min(1, v.lines).max(2000, v.long),
});

export const updateStocktakeSchema = z.object({
  id: z.string().trim().min(1, v.required).max(80, v.long),
  note: optionalNote,
  lines: z.array(stocktakeLineSchema).min(1, v.lines).max(2000, v.long),
});

export const stocktakeIdSchema = z.string().trim().min(1, v.required).max(80, v.long);

export const partyIdSchema = z.string().trim().min(1, v.required).max(80, v.long);

const partyFieldsSchema = z.object({
  name: z.string().trim().min(2, v.short).max(200, v.long),
  phone: egyptPhoneSchema.optional().or(z.literal("")),
  address: z.string().trim().max(500, v.long).optional(),
  notes: optionalNote,
});

export const createPartySchema = partyFieldsSchema.extend({
  openingBalance: moneyText,
});

export const updatePartySchema = partyFieldsSchema;

export const transferCashSchema = z.object({
  fromCashboxId: partyIdSchema,
  toCashboxId: partyIdSchema,
  amount: positiveMoney,
}).refine((transfer) => transfer.fromCashboxId !== transfer.toCashboxId, {
  path: ["toCashboxId"], message: messages.cashboxes.transferDialog.errorSameCashbox,
});

const moneyDocumentFields = {
  cashboxId: partyIdSchema,
  amount: positiveMoney,
  note: optionalNote,
};

/** Offline-created collections/payments carry their real time, so a later sync doesn't re-date them. */
const offlineOccurredAt = z.coerce
  .date()
  .refine((date) => date.getTime() <= Date.now() + 5 * 60_000, v.invalid)
  .optional();

export const createCollectionSchema = z.object({
  customerId: partyIdSchema,
  ...moneyDocumentFields,
  clientRequestId,
  occurredAt: offlineOccurredAt,
});

export const updateCollectionSchema = z.object({
  customerId: partyIdSchema,
  ...moneyDocumentFields,
  id: partyIdSchema,
});

export const createPaymentSchema = z.object({
  supplierId: partyIdSchema,
  ...moneyDocumentFields,
  clientRequestId,
  occurredAt: offlineOccurredAt,
});

export const updatePaymentSchema = z.object({
  supplierId: partyIdSchema,
  ...moneyDocumentFields,
  id: partyIdSchema,
});

export const cancelMoneyDocumentSchema = z.object({
  id: partyIdSchema,
  reason: z.string().trim().max(500, v.long).optional().transform((value) => value || undefined),
});

export const reportFiltersSchema = z
  .object({
    from: isoDate.optional(),
    to: isoDate.optional(),
    customerId: optionalId,
    supplierId: optionalId,
    cashboxId: optionalId,
    categoryId: optionalId,
    productId: optionalId,
    userId: optionalId,
  })
  .refine(
    (filters) => !filters.from || !filters.to || filters.from <= filters.to,
    { path: ["to"], message: v.dateRange },
  );

export const reportFoundationSchema = reportFiltersSchema.and(
  z.object({
    reportKey: z.enum([
      "sales",
      "purchases",
      "inventory",
      "customers",
      "suppliers",
      "cashboxes",
      "collections",
      "payments",
      "profit-loss",
    ]),
  }),
);

export const auditLogFilterSchema = z
  .object({
    userId: optionalId,
    action: z.string().trim().max(100, v.long).optional(),
    entityType: z.string().trim().max(100, v.long).optional(),
    from: isoDate.optional(),
    to: isoDate.optional(),
    page: z.coerce.number().int().min(1).optional(),
  })
  .refine((filters) => !filters.from || !filters.to || filters.from <= filters.to, {
    path: ["to"], message: v.dateRange,
  });

export const shopProfileSchema = z.object({
  name: z.string().trim().min(2, v.short).max(200, v.long),
  phone: egyptPhoneSchema,
  address: z.string().trim().min(2, v.short).max(500, v.long),
  taxNote: z.string().trim().max(500, v.long).optional(),
  invoiceFooter: z.string().trim().max(500, v.long).optional(),
});

export const printPreferencesSchema = z.object({
  defaultPrintSize: z.enum(["A4", "A5", "80mm"]),
  defaultCashboxId: partyIdSchema,
});

export const categorySchema = z.object({
  name: z.string().trim().min(2, v.short).max(120, v.long),
  description: z.string().trim().max(500, v.long).optional(),
});

export const settingsCashboxSchema = z.object({
  name: z.string().trim().min(2, v.short).max(120, v.long),
  description: z.string().trim().max(500, v.long).optional(),
  isActive: z.boolean(),
});

export const settingsUserSchema = z.object({
  displayName: z.string().trim().min(2, v.short).max(120, v.long),
  username: z.string().trim().min(3, v.short).max(80, v.long).regex(/^[a-zA-Z][a-zA-Z0-9._-]*$/, v.invalid),
  password: z.string().max(72, v.long).optional(),
  roleId: partyIdSchema,
  isActive: z.boolean(),
});

export const roleSchema = z.object({
  name: z.string().trim().min(2, v.short).max(120, v.long),
  description: z.string().trim().max(500, v.long).optional(),
  permissions: z.array(z.string().trim().min(1).max(100)).max(100),
});

const printFieldItemSchema = z.object({
  id: z.string().min(1).max(100),
  label: z.string().max(120, v.long),
  source: z.discriminatedUnion("kind", [
    z.object({
      kind: z.literal("system"),
      fieldKey: z.enum([
        "invoiceNumber", "invoiceDate", "invoiceTime", "cashierName",
        "customerName", "customerCompanyName", "customerPhone", "customerAddress",
        "shopName", "shopPhone", "shopPhone2", "shopAddress",
      ]),
    }),
    z.object({ kind: z.literal("custom"), value: z.string().max(300, v.long) }),
  ]),
});

export const printTemplateLayoutSchema = z.object({
  templateName: z.string().trim().max(120, v.long),
  // Logo is stored inline as a data URL; ~1.5 MB of base64 covers a ~1 MB image.
  logoDataUrl: z.string().startsWith("data:image/").max(1_500_000, v.long).optional(),
  lineColumns: z
    .array(z.object({ key: z.enum(["productCode", "unitName", "sku", "discount"]), labelKey: z.string().max(100), visible: z.boolean() }))
    .max(10),
  infoColumns: z.object({ col1: z.array(printFieldItemSchema).max(20), col2: z.array(printFieldItemSchema).max(20) }),
  totalsRows: z
    .array(
      z.object({
        key: z.enum(["total", "discount", "previousBalance", "paid", "remaining"]),
        labelKey: z.string().max(100),
        label: z.string().max(120, v.long),
        visible: z.boolean(),
      }),
    )
    .max(10),
});

export const printTemplateSchema = printTemplateLayoutSchema.extend({
  shop: z.object({
    name: z.string().trim().min(1, v.required).max(200, v.long),
    phone: z.string().trim().max(40, v.long),
    phone2: z.string().trim().max(40, v.long).optional(),
    address: z.string().trim().max(300, v.long),
    invoiceFooter: z.string().trim().max(500, v.long).optional(),
  }),
});

export const RESET_DATA_CONFIRM_PHRASE = "حذف كل البيانات";

export const resetAllDataSchema = z.object({
  password: z.string().min(1, v.required).max(72, v.long),
  confirmPhrase: z.literal(RESET_DATA_CONFIRM_PHRASE),
});

export const restoreBackupSchema = z.object({
  password: z.string().min(1, v.required).max(72, v.long),
  fileContent: z.string().min(1, v.required),
  scope: z.enum(["inventory", "customers", "suppliers", "sales", "payments", "all"]).default("all"),
});

export const backupReminderSchema = z
  .object({
    frequency: z.enum(["off", "daily", "weekly", "monthly"]),
    time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, v.invalid),
    dayOfWeek: z.number().int().min(0).max(6).optional(),
    dayOfMonth: z.number().int().min(1).max(31).optional(),
  })
  .refine((data) => data.frequency !== "weekly" || data.dayOfWeek !== undefined, { message: v.required, path: ["dayOfWeek"] })
  .refine((data) => data.frequency !== "monthly" || data.dayOfMonth !== undefined, { message: v.required, path: ["dayOfMonth"] });

export const updateProfileSchema = z.object({
  displayName: z.string().trim().min(2, v.short).max(120, v.long),
  username: z.string().trim().min(3, v.short).max(80, v.long).regex(/^[a-zA-Z][a-zA-Z0-9._-]*$/, v.invalid),
  avatarUrl: z.string().trim().max(2_000_000, v.long).optional().nullable(),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, v.required).max(72, v.long),
    newPassword: z
      .string()
      .min(8, v.short)
      .max(72, v.long)
      .regex(/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9])/, v.password),
    confirmNewPassword: z.string().min(1, v.required).max(72, v.long),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    path: ["confirmNewPassword"],
    message: v.passwordMatch,
  });

// Define every Zod schema here as each domain is implemented.
