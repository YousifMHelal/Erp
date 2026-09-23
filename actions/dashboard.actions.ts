"use server";

import { Prisma } from "@prisma/client";
import { AuthRequiredError, requireAuth } from "@/lib/auth-guard";
import { fail, ok } from "@/lib/action-result";
import { prisma } from "@/lib/prisma";
import messages from "@/messages/ar.json";
import type { ActionResult, DashboardOverview } from "@/types";

const m = messages.dashboardAction;
const ZERO = new Prisma.Decimal(0);
const DAY_IN_MS = 86_400_000;
const TREND_DAYS = 7;
const LOW_STOCK_LIMIT = 5;
const TOP_DEBTORS_LIMIT = 5;
const RECENT_INVOICES_LIMIT = 5;

function actionError<T>(error: unknown): ActionResult<T> {
  if (error instanceof AuthRequiredError) return fail(m.unauthorized);
  console.error("Dashboard action failed", error);
  return fail(m.failed);
}

function dayRange(daysAgo: number): { gte: Date; lt: Date } {
  const now = new Date();
  const startOfToday = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const gte = new Date(startOfToday - daysAgo * DAY_IN_MS);
  const lt = new Date(gte.getTime() + DAY_IN_MS);
  return { gte, lt };
}

function sum(values: Prisma.Decimal[]): Prisma.Decimal {
  return values.reduce((total, value) => total.plus(value), ZERO);
}

function percentDelta(today: Prisma.Decimal, yesterday: Prisma.Decimal): { value: number; tone: "success" | "danger" } {
  if (yesterday.isZero()) {
    return { value: today.isZero() ? 0 : 100, tone: "success" };
  }
  const change = today.minus(yesterday).dividedBy(yesterday).times(100);
  return { value: change.toDecimalPlaces(1).toNumber(), tone: change.isNegative() ? "danger" : "success" };
}

export async function getDashboardOverview(): Promise<ActionResult<DashboardOverview>> {
  try {
    await requireAuth();

    const today = dayRange(0);
    const yesterday = dayRange(1);
    const trendStart = dayRange(TREND_DAYS - 1).gte;

    const [
      todaySalesInvoices,
      yesterdaySalesInvoices,
      todayPurchasesInvoices,
      yesterdayPurchasesInvoices,
      trendInvoices,
      customersWithBalance,
      lowStockProducts,
      recentInvoices,
    ] = await Promise.all([
      prisma.invoice.findMany({
        where: { type: "SALE", status: "CONFIRMED", issuedAt: { gte: today.gte, lt: today.lt } },
        select: { total: true },
      }),
      prisma.invoice.findMany({
        where: { type: "SALE", status: "CONFIRMED", issuedAt: { gte: yesterday.gte, lt: yesterday.lt } },
        select: { total: true },
      }),
      prisma.invoice.findMany({
        where: { type: "PURCHASE", status: "CONFIRMED", issuedAt: { gte: today.gte, lt: today.lt } },
        select: { total: true },
      }),
      prisma.invoice.findMany({
        where: { type: "PURCHASE", status: "CONFIRMED", issuedAt: { gte: yesterday.gte, lt: yesterday.lt } },
        select: { total: true },
      }),
      prisma.invoice.findMany({
        where: { type: "SALE", status: "CONFIRMED", issuedAt: { gte: trendStart } },
        select: { total: true, issuedAt: true },
        orderBy: { issuedAt: "asc" },
      }),
      prisma.customer.findMany({
        where: { isActive: true, balance: { gt: 0 } },
        select: { id: true, name: true, balance: true },
        orderBy: { balance: "desc" },
      }),
      prisma.product.findMany({
        where: { isActive: true },
        select: { id: true, name: true, stockQty: true, minStockQty: true, subUnitName: true },
        orderBy: { stockQty: "asc" },
      }),
      prisma.invoice.findMany({
        where: { type: "SALE", status: "CONFIRMED" },
        select: {
          id: true,
          number: true,
          total: true,
          paymentStatus: true,
          issuedAt: true,
          customer: { select: { name: true } },
        },
        orderBy: { issuedAt: "desc" },
        take: RECENT_INVOICES_LIMIT,
      }),
    ]);

    const todaySalesTotal = sum(todaySalesInvoices.map((i) => i.total));
    const yesterdaySalesTotal = sum(yesterdaySalesInvoices.map((i) => i.total));
    const todayPurchasesTotal = sum(todayPurchasesInvoices.map((i) => i.total));
    const yesterdayPurchasesTotal = sum(yesterdayPurchasesInvoices.map((i) => i.total));

    const trendByDay = new Map<string, Prisma.Decimal>();
    for (const invoice of trendInvoices) {
      const date = invoice.issuedAt.toISOString().slice(0, 10);
      trendByDay.set(date, (trendByDay.get(date) ?? ZERO).plus(invoice.total));
    }
    const salesTrend = Array.from({ length: TREND_DAYS }, (_, i) => {
      const date = new Date(trendStart.getTime() + i * DAY_IN_MS).toISOString().slice(0, 10);
      return { date, total: (trendByDay.get(date) ?? ZERO).toNumber() };
    });

    const totalReceivables = sum(customersWithBalance.map((c) => c.balance));

    return ok({
      todaySales: todaySalesTotal.toNumber(),
      todaySalesDelta: percentDelta(todaySalesTotal, yesterdaySalesTotal),
      todayPurchases: todayPurchasesTotal.toNumber(),
      todayPurchasesDelta: percentDelta(todayPurchasesTotal, yesterdayPurchasesTotal),
      invoiceCount: todaySalesInvoices.length,
      invoiceCountDelta: {
        value: todaySalesInvoices.length - yesterdaySalesInvoices.length,
        tone: todaySalesInvoices.length >= yesterdaySalesInvoices.length ? "success" : "danger",
      },
      totalReceivables: totalReceivables.toNumber(),
      salesTrend,
      lowStock: lowStockProducts
        .filter((p) => p.stockQty.lte(p.minStockQty))
        .slice(0, LOW_STOCK_LIMIT)
        .map((p) => ({
          id: p.id,
          name: p.name,
          stockQty: p.stockQty.toNumber(),
          minStockQty: p.minStockQty.toNumber(),
          unitName: p.subUnitName,
        })),
      topDebtors: customersWithBalance.slice(0, TOP_DEBTORS_LIMIT).map((c) => ({
        id: c.id,
        name: c.name,
        balance: c.balance.toString(),
      })),
      recentInvoices: recentInvoices.map((invoice) => ({
        id: invoice.id,
        number: invoice.number,
        partyName: invoice.customer?.name ?? messages.invoices.list.walkInCustomer,
        total: invoice.total.toString(),
        paymentStatus: invoice.paymentStatus,
        issuedAt: invoice.issuedAt.toISOString(),
      })),
    });
  } catch (error) {
    return actionError(error);
  }
}
