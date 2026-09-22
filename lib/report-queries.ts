import { Prisma, type InvoiceType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { ReportDataset, ReportFilters, ReportKey } from "@/types";

const ZERO = new Prisma.Decimal(0);
const DAY_IN_MS = 86_400_000;

export function reportDateRange(filters: ReportFilters): Prisma.DateTimeFilter | undefined {
  if (!filters.from && !filters.to) return undefined;
  return {
    gte: filters.from ? new Date(`${filters.from}T00:00:00Z`) : undefined,
    lt: filters.to ? new Date(Date.parse(`${filters.to}T00:00:00Z`) + DAY_IN_MS) : undefined,
  };
}

function sum(values: Prisma.Decimal[]): Prisma.Decimal {
  return values.reduce((total, value) => total.plus(value), ZERO);
}

async function getInvoiceReport(
  type: "SALE" | "PURCHASE",
  filters: ReportFilters,
): Promise<ReportDataset> {
  const invoices = await prisma.invoice.findMany({
    where: {
      type,
      status: "CONFIRMED",
      customerId: filters.customerId,
      supplierId: filters.supplierId,
      cashboxId: filters.cashboxId,
      createdById: filters.userId,
      issuedAt: reportDateRange(filters),
      lines: filters.productId ? { some: { productId: filters.productId, isCurrent: true } } : undefined,
    },
    orderBy: { issuedAt: "asc" },
  });
  const daily = new Map<string, typeof invoices>();
  for (const invoice of invoices) {
    const date = invoice.issuedAt.toISOString().slice(0, 10);
    daily.set(date, [...(daily.get(date) ?? []), invoice]);
  }
  const rows = Array.from(daily, ([date, entries]) => ({
    date,
    count: String(entries.length),
    subtotal: sum(entries.map((entry) => entry.subtotal)).toString(),
    discount: sum(entries.map((entry) => entry.discountAmount)).toString(),
    total: sum(entries.map((entry) => entry.total)).toString(),
    paid: sum(entries.map((entry) => entry.paidAmount)).toString(),
    remaining: sum(entries.map((entry) => entry.remainingAmount)).toString(),
  }));
  const total = sum(invoices.map((invoice) => invoice.total));
  return {
    columns: ["date", "count", "subtotal", "discount", "total", "paid", "remaining"],
    moneyColumns: ["subtotal", "discount", "total", "paid", "remaining"],
    rows,
    footerRow: {
      date: "total",
      count: String(invoices.length),
      subtotal: sum(invoices.map((invoice) => invoice.subtotal)).toString(),
      discount: sum(invoices.map((invoice) => invoice.discountAmount)).toString(),
      total: total.toString(),
      paid: sum(invoices.map((invoice) => invoice.paidAmount)).toString(),
      remaining: sum(invoices.map((invoice) => invoice.remainingAmount)).toString(),
    },
    chart: {
      titleKey: type === "SALE" ? "salesTrend" : "purchasesTrend",
      data: rows.map((row) => ({ label: row.date, value: Number(row.total) })),
    },
  };
}

async function getInventoryReport(filters: ReportFilters): Promise<ReportDataset> {
  const products = await prisma.product.findMany({
    where: {
      id: filters.productId,
      categoryId: filters.categoryId,
      stockMovements: filters.from || filters.to ? { some: { createdAt: reportDateRange(filters) } } : undefined,
    },
    include: { category: { select: { name: true } } },
    orderBy: { name: "asc" },
  });
  const rows = products.map((product) => {
    const sellPerSub = product.sellPricePerBase.div(product.unitsPerBase);
    return {
      product: product.name,
      category: product.category?.name ?? "",
      quantity: product.stockQty.toString(),
      unit: product.subUnitName,
      valueAtCost: product.stockQty.mul(product.avgCostPerSub).toDecimalPlaces(2).toString(),
      valueAtSale: product.stockQty.mul(sellPerSub).toDecimalPlaces(2).toString(),
    };
  });
  return {
    columns: ["product", "category", "quantity", "unit", "valueAtCost", "valueAtSale"],
    moneyColumns: ["valueAtCost", "valueAtSale"],
    rows,
    footerRow: {
      product: "total",
      category: "",
      quantity: sum(products.map((product) => product.stockQty)).toString(),
      unit: "",
      valueAtCost: sum(products.map((product) => product.stockQty.mul(product.avgCostPerSub))).toDecimalPlaces(2).toString(),
      valueAtSale: sum(products.map((product) => product.stockQty.mul(product.sellPricePerBase.div(product.unitsPerBase)))).toDecimalPlaces(2).toString(),
    },
  };
}

async function getPartyReport(
  partyType: "CUSTOMER" | "SUPPLIER",
  filters: ReportFilters,
): Promise<ReportDataset> {
  const invoiceType: InvoiceType = partyType === "CUSTOMER" ? "SALE" : "PURCHASE";
  const range = reportDateRange(filters);
  const parties = partyType === "CUSTOMER"
    ? await prisma.customer.findMany({
        where: { id: filters.customerId }, orderBy: { name: "asc" },
        include: {
          invoices: { where: { type: invoiceType, status: "CONFIRMED", issuedAt: range }, select: { total: true } },
          collections: { where: { status: "CONFIRMED", occurredAt: range }, select: { amount: true } },
        },
      })
    : await prisma.supplier.findMany({
        where: { id: filters.supplierId }, orderBy: { name: "asc" },
        include: {
          invoices: { where: { type: invoiceType, status: "CONFIRMED", issuedAt: range }, select: { total: true } },
          payments: { where: { status: "CONFIRMED", occurredAt: range }, select: { amount: true } },
        },
      });
  const rows = parties.map((party) => {
    const settlements = "collections" in party ? party.collections : party.payments;
    return {
      name: party.name,
      count: String(party.invoices.length),
      invoiced: sum(party.invoices.map((invoice) => invoice.total)).toString(),
      settled: sum(settlements.map((settlement) => settlement.amount)).toString(),
      balance: party.balance.toString(),
    };
  });
  return {
    columns: ["name", "count", "invoiced", "settled", "balance"],
    moneyColumns: ["invoiced", "settled", "balance"],
    rows,
    footerRow: {
      name: "total", count: String(rows.reduce((count, row) => count + Number(row.count), 0)),
      invoiced: sum(rows.map((row) => new Prisma.Decimal(row.invoiced))).toString(),
      settled: sum(rows.map((row) => new Prisma.Decimal(row.settled))).toString(),
      balance: sum(rows.map((row) => new Prisma.Decimal(row.balance))).toString(),
    },
  };
}

async function getMoneyDocumentReport(
  reportKey: "collections" | "payments",
  filters: ReportFilters,
): Promise<ReportDataset> {
  const rows = reportKey === "collections"
    ? (await prisma.collection.findMany({
        where: { status: "CONFIRMED", customerId: filters.customerId, cashboxId: filters.cashboxId, occurredAt: reportDateRange(filters) },
        include: { customer: true, cashbox: true }, orderBy: { occurredAt: "desc" },
      })).map((entry) => ({ date: entry.occurredAt.toISOString().slice(0, 10), number: String(entry.number), party: entry.customer.name, cashbox: entry.cashbox.name, amount: entry.amount.toString() }))
    : (await prisma.payment.findMany({
        where: { status: "CONFIRMED", supplierId: filters.supplierId, cashboxId: filters.cashboxId, occurredAt: reportDateRange(filters) },
        include: { supplier: true, cashbox: true }, orderBy: { occurredAt: "desc" },
      })).map((entry) => ({ date: entry.occurredAt.toISOString().slice(0, 10), number: String(entry.number), party: entry.supplier.name, cashbox: entry.cashbox.name, amount: entry.amount.toString() }));
  return {
    columns: ["date", "number", "party", "cashbox", "amount"], moneyColumns: ["amount"], rows,
    footerRow: { date: "total", number: String(rows.length), party: "", cashbox: "", amount: sum(rows.map((row) => new Prisma.Decimal(row.amount))).toString() },
  };
}

async function getCashboxReport(filters: ReportFilters): Promise<ReportDataset> {
  const cashboxes = await prisma.cashbox.findMany({
    where: { id: filters.cashboxId }, orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: { cashMovements: { where: { createdAt: reportDateRange(filters) }, select: { amount: true } } },
  });
  const rows = cashboxes.map((cashbox) => {
    const inflow = sum(cashbox.cashMovements.filter((movement) => movement.amount.gt(0)).map((movement) => movement.amount));
    const outflow = sum(cashbox.cashMovements.filter((movement) => movement.amount.lt(0)).map((movement) => movement.amount.abs()));
    return { name: cashbox.name, count: String(cashbox.cashMovements.length), inflow: inflow.toString(), outflow: outflow.toString(), net: inflow.minus(outflow).toString(), balance: cashbox.balance.toString() };
  });
  return {
    columns: ["name", "count", "inflow", "outflow", "net", "balance"], moneyColumns: ["inflow", "outflow", "net", "balance"], rows,
    footerRow: {
      name: "total", count: String(rows.reduce((count, row) => count + Number(row.count), 0)),
      inflow: sum(rows.map((row) => new Prisma.Decimal(row.inflow))).toString(), outflow: sum(rows.map((row) => new Prisma.Decimal(row.outflow))).toString(),
      net: sum(rows.map((row) => new Prisma.Decimal(row.net))).toString(), balance: sum(rows.map((row) => new Prisma.Decimal(row.balance))).toString(),
    },
  };
}

async function getProfitLossReport(filters: ReportFilters): Promise<ReportDataset> {
  const invoices = await prisma.invoice.findMany({
    where: {
      type: { in: ["SALE", "SALE_RETURN"] }, status: "CONFIRMED", customerId: filters.customerId,
      cashboxId: filters.cashboxId, createdById: filters.userId, issuedAt: reportDateRange(filters),
      lines: filters.productId ? { some: { productId: filters.productId, isCurrent: true } } : undefined,
    },
    include: { lines: { where: { isCurrent: true } } }, orderBy: { issuedAt: "asc" },
  });
  const periods = new Map<string, typeof invoices>();
  for (const invoice of invoices) {
    const date = invoice.issuedAt.toISOString().slice(0, 10);
    periods.set(date, [...(periods.get(date) ?? []), invoice]);
  }
  const rows = Array.from(periods, ([date, entries]) => {
    const sales = entries.filter((entry) => entry.type === "SALE");
    const returns = entries.filter((entry) => entry.type === "SALE_RETURN");
    const revenue = sum(sales.map((entry) => entry.subtotal));
    const discounts = sum(sales.map((entry) => entry.discountAmount));
    const returned = sum(returns.map((entry) => entry.total));
    const saleCost = sum(sales.flatMap((entry) => entry.lines.map((line) => line.qtyInSub.mul(line.costPerSubAtSale))));
    const returnedCost = sum(returns.flatMap((entry) => entry.lines.map((line) => line.qtyInSub.mul(line.costPerSubAtSale))));
    const cogs = saleCost.minus(returnedCost);
    const netRevenue = revenue.minus(discounts).minus(returned);
    const grossProfit = netRevenue.minus(cogs);
    return { date, revenue: revenue.toString(), discounts: discounts.toString(), returns: returned.toString(), cogs: cogs.toString(), grossProfit: grossProfit.toString(), margin: netRevenue.isZero() ? "0" : grossProfit.div(netRevenue).mul(100).toDecimalPlaces(2).toString() };
  });
  const total = (key: "revenue" | "discounts" | "returns" | "cogs" | "grossProfit") =>
    sum(rows.map((row) => new Prisma.Decimal(row[key])));
  const netRevenue = total("revenue").minus(total("discounts")).minus(total("returns"));
  const grossProfit = total("grossProfit");
  return {
    columns: ["date", "revenue", "discounts", "returns", "cogs", "grossProfit", "margin"],
    moneyColumns: ["revenue", "discounts", "returns", "cogs", "grossProfit"], rows,
    footerRow: { date: "total", revenue: total("revenue").toString(), discounts: total("discounts").toString(), returns: total("returns").toString(), cogs: total("cogs").toString(), grossProfit: grossProfit.toString(), margin: netRevenue.isZero() ? "0" : grossProfit.div(netRevenue).mul(100).toDecimalPlaces(2).toString() },
    chart: { titleKey: "profitTrend", data: rows.map((row) => ({ label: row.date, value: Number(row.grossProfit) })) },
  };
}

export function queryReport(reportKey: ReportKey, filters: ReportFilters): Promise<ReportDataset> {
  switch (reportKey) {
    case "sales": return getInvoiceReport("SALE", filters);
    case "purchases": return getInvoiceReport("PURCHASE", filters);
    case "inventory": return getInventoryReport(filters);
    case "customers": return getPartyReport("CUSTOMER", filters);
    case "suppliers": return getPartyReport("SUPPLIER", filters);
    case "cashboxes": return getCashboxReport(filters);
    case "collections": return getMoneyDocumentReport("collections", filters);
    case "payments": return getMoneyDocumentReport("payments", filters);
    case "profit-loss": return getProfitLossReport(filters);
  }
}
