"use server";

import type { Prisma } from "@prisma/client";
import { fail, ok } from "@/lib/action-result";
import {
  AuthRequiredError,
  PermissionDeniedError,
  requirePermission,
} from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { queryReport, reportDateRange } from "@/lib/report-queries";
import { reportFoundationSchema } from "@/lib/validations";
import messages from "@/messages/ar.json";
import type {
  ActionResult,
  ReportDateBounds,
  ReportFilterOptions,
  ReportFilters,
  ReportFoundation,
  ReportDataset,
  ReportKey,
} from "@/types";

const m = messages.reportAction;
const CUSTOMER_FILTER_REPORTS = new Set<ReportKey>([
  "sales",
  "customers",
  "cashboxes",
  "collections",
  "profit-loss",
]);
const SUPPLIER_FILTER_REPORTS = new Set<ReportKey>([
  "purchases",
  "suppliers",
  "cashboxes",
  "payments",
]);
const CASHBOX_FILTER_REPORTS = new Set<ReportKey>([
  "sales",
  "purchases",
  "cashboxes",
  "collections",
  "payments",
  "profit-loss",
]);
const PRODUCT_FILTER_REPORTS = new Set<ReportKey>([
  "sales",
  "purchases",
  "inventory",
  "profit-loss",
]);
const USER_FILTER_REPORTS = new Set<ReportKey>([
  "sales",
  "purchases",
  "profit-loss",
]);

function actionError<T>(error: unknown): ActionResult<T> {
  if (error instanceof AuthRequiredError) return fail(m.unauthorized);
  if (error instanceof PermissionDeniedError) return fail(m.forbidden);
  console.error("Report action failed", error);
  return fail(m.failed);
}

function serializeBounds(min: Date | null, max: Date | null): ReportDateBounds {
  return {
    from: min?.toISOString().slice(0, 10),
    to: max?.toISOString().slice(0, 10),
  };
}

async function getInvoiceDateBounds(
  reportKey: "sales" | "purchases" | "profit-loss",
  filters: ReportFilters,
): Promise<ReportDateBounds> {
  const type: Prisma.InvoiceWhereInput["type"] =
    reportKey === "sales"
      ? "SALE"
      : reportKey === "purchases"
        ? "PURCHASE"
        : { in: ["SALE", "SALE_RETURN"] };
  const bounds = await prisma.invoice.aggregate({
    where: {
      type,
      status: "CONFIRMED",
      customerId: filters.customerId,
      supplierId: filters.supplierId,
      cashboxId: filters.cashboxId,
      createdById: filters.userId,
      issuedAt: reportDateRange(filters),
      lines: filters.productId
        ? { some: { productId: filters.productId, isCurrent: true } }
        : undefined,
    },
    _min: { issuedAt: true },
    _max: { issuedAt: true },
  });
  return serializeBounds(bounds._min.issuedAt, bounds._max.issuedAt);
}

async function getInventoryDateBounds(
  filters: ReportFilters,
): Promise<ReportDateBounds> {
  const bounds = await prisma.stockMovement.aggregate({
    where: {
      productId: filters.productId,
      product: filters.categoryId
        ? { categoryId: filters.categoryId }
        : undefined,
      createdAt: reportDateRange(filters),
    },
    _min: { createdAt: true },
    _max: { createdAt: true },
  });
  return serializeBounds(bounds._min.createdAt, bounds._max.createdAt);
}

async function getPartyDateBounds(
  reportKey: "customers" | "suppliers",
  filters: ReportFilters,
): Promise<ReportDateBounds> {
  const bounds = await prisma.partyTransaction.aggregate({
    where: {
      partyType: reportKey === "customers" ? "CUSTOMER" : "SUPPLIER",
      customerId: filters.customerId,
      supplierId: filters.supplierId,
      occurredAt: reportDateRange(filters),
    },
    _min: { occurredAt: true },
    _max: { occurredAt: true },
  });
  return serializeBounds(bounds._min.occurredAt, bounds._max.occurredAt);
}

async function getCashboxDateBounds(
  filters: ReportFilters,
): Promise<ReportDateBounds> {
  const bounds = await prisma.cashMovement.aggregate({
    where: {
      cashboxId: filters.cashboxId,
      customerId: filters.customerId,
      supplierId: filters.supplierId,
      createdAt: reportDateRange(filters),
    },
    _min: { createdAt: true },
    _max: { createdAt: true },
  });
  return serializeBounds(bounds._min.createdAt, bounds._max.createdAt);
}

async function getCollectionDateBounds(
  filters: ReportFilters,
): Promise<ReportDateBounds> {
  const bounds = await prisma.collection.aggregate({
    where: {
      customerId: filters.customerId,
      cashboxId: filters.cashboxId,
      occurredAt: reportDateRange(filters),
    },
    _min: { occurredAt: true },
    _max: { occurredAt: true },
  });
  return serializeBounds(bounds._min.occurredAt, bounds._max.occurredAt);
}

async function getPaymentDateBounds(
  filters: ReportFilters,
): Promise<ReportDateBounds> {
  const bounds = await prisma.payment.aggregate({
    where: {
      supplierId: filters.supplierId,
      cashboxId: filters.cashboxId,
      occurredAt: reportDateRange(filters),
    },
    _min: { occurredAt: true },
    _max: { occurredAt: true },
  });
  return serializeBounds(bounds._min.occurredAt, bounds._max.occurredAt);
}

function getMatchedDateRange(reportKey: ReportKey, filters: ReportFilters) {
  switch (reportKey) {
    case "sales":
    case "purchases":
    case "profit-loss":
      return getInvoiceDateBounds(reportKey, filters);
    case "inventory":
      return getInventoryDateBounds(filters);
    case "customers":
    case "suppliers":
      return getPartyDateBounds(reportKey, filters);
    case "cashboxes":
      return getCashboxDateBounds(filters);
    case "collections":
      return getCollectionDateBounds(filters);
    case "payments":
      return getPaymentDateBounds(filters);
  }
}

async function getCustomerOptions(reportKey: ReportKey) {
  if (!CUSTOMER_FILTER_REPORTS.has(reportKey)) return [];
  const customers = await prisma.customer.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });
  return customers.map(({ id, name }) => ({ value: id, label: name }));
}

async function getSupplierOptions(reportKey: ReportKey) {
  if (!SUPPLIER_FILTER_REPORTS.has(reportKey)) return [];
  const suppliers = await prisma.supplier.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });
  return suppliers.map(({ id, name }) => ({ value: id, label: name }));
}

async function getCashboxOptions(reportKey: ReportKey) {
  if (!CASHBOX_FILTER_REPORTS.has(reportKey)) return [];
  const cashboxes = await prisma.cashbox.findMany({
    where: { isActive: true },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: { id: true, name: true },
  });
  return cashboxes.map(({ id, name }) => ({ value: id, label: name }));
}

async function getCategoryOptions(reportKey: ReportKey) {
  if (reportKey !== "inventory") return [];
  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });
  return categories.map(({ id, name }) => ({ value: id, label: name }));
}

async function getProductOptions(reportKey: ReportKey) {
  if (!PRODUCT_FILTER_REPORTS.has(reportKey)) return [];
  const products = await prisma.product.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });
  return products.map(({ id, name }) => ({ value: id, label: name }));
}

async function getUserOptions(reportKey: ReportKey) {
  if (!USER_FILTER_REPORTS.has(reportKey)) return [];
  const users = await prisma.user.findMany({
    where: { isActive: true },
    orderBy: { displayName: "asc" },
    select: { id: true, displayName: true },
  });
  return users.map(({ id, displayName }) => ({
    value: id,
    label: displayName,
  }));
}

async function getFilterOptions(
  reportKey: ReportKey,
): Promise<ReportFilterOptions> {
  const [customers, suppliers, cashboxes, categories, products, users] =
    await Promise.all([
      getCustomerOptions(reportKey),
      getSupplierOptions(reportKey),
      getCashboxOptions(reportKey),
      getCategoryOptions(reportKey),
      getProductOptions(reportKey),
      getUserOptions(reportKey),
    ]);
  return { customers, suppliers, cashboxes, categories, products, users };
}

export async function getReportFoundation(
  input: unknown,
): Promise<ActionResult<ReportFoundation>> {
  try {
    await requirePermission("report.view");
    const parsed = reportFoundationSchema.safeParse(input);
    if (!parsed.success) {
      return fail(m.invalid, parsed.error.flatten().fieldErrors);
    }

    const { reportKey, ...filters } = parsed.data;
    const [options, matchedDateRange] = await Promise.all([
      getFilterOptions(reportKey),
      getMatchedDateRange(reportKey, filters),
    ]);
    return ok({ filters, options, matchedDateRange });
  } catch (error) {
    return actionError(error);
  }
}

async function requireReportPermission(reportKey: ReportKey) {
  await requirePermission(reportKey === "profit-loss" ? "report.profitLoss" : "report.view");
}

export async function getReportData(input: unknown): Promise<ActionResult<ReportDataset>> {
  try {
    const parsed = reportFoundationSchema.safeParse(input);
    if (!parsed.success) return fail(m.invalid, parsed.error.flatten().fieldErrors);
    await requireReportPermission(parsed.data.reportKey);
    const { reportKey, ...filters } = parsed.data;
    return ok(await queryReport(reportKey, filters));
  } catch (error) {
    return actionError(error);
  }
}

function csvCell(value: string): string {
  return `"${value.replaceAll('"', '""')}"`;
}

export async function exportReportCsv(input: unknown): Promise<ActionResult<string>> {
  try {
    const parsed = reportFoundationSchema.safeParse(input);
    if (!parsed.success) return fail(m.invalid, parsed.error.flatten().fieldErrors);
    await requirePermission("report.export");
    if (parsed.data.reportKey === "profit-loss") await requirePermission("report.profitLoss");
    const { reportKey, ...filters } = parsed.data;
    const report = await queryReport(reportKey, filters);
    const labels = messages.reports.columns;
    const header = report.columns.map((column) => csvCell(labels[column as keyof typeof labels])).join(",");
    const body = report.rows.map((row) => report.columns.map((column) => csvCell(row[column] ?? "")).join(","));
    return ok(`\uFEFF${[header, ...body].join("\r\n")}`);
  } catch (error) {
    return actionError(error);
  }
}
