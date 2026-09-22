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

export const createSaleSchema = saleFieldsSchema.superRefine(checkSaleAmounts);

export const updateSaleSchema = saleFieldsSchema.extend({
  id: z.string().trim().min(1, v.required).max(80, v.long),
  updatedAt: z.coerce.date(),
}).superRefine(checkSaleAmounts);

export const cancelSaleSchema = z.object({
  id: z.string().trim().min(1, v.required).max(80, v.long),
  reason: z.string().trim().min(3, v.short).max(500, v.long),
});

export const saleIdSchema = z
  .string()
  .trim()
  .min(1, v.required)
  .max(80, v.long);

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

// Define every Zod schema here as each domain is implemented.

/** Demo-only schema for the /design-system form anatomy preview. Delete at P8-11. */
export const designSystemDemoSchema = z.object({
  name: z.string().trim().min(2, "الاسم قصير جداً"),
  phone: z
    .string()
    .trim()
    .regex(/^01[0125][0-9]{8}$/, "رقم هاتف مصري غير صالح"),
  password: z.string().min(8, "٨ أحرف على الأقل"),
  cashbox: z.enum(["نقدي", "فودافون كاش", "إنستاباي"]),
  active: z.boolean(),
});

export type DesignSystemDemoValues = z.infer<typeof designSystemDemoSchema>;
