import { shopDayEnd, shopDayStart } from "@/lib/format";
import messages from "@/messages/ar.json";
import type { StatementFilters, StatementLine, StatementTypeFilter } from "@/types";

const TYPE_FILTERS: readonly StatementTypeFilter[] = ["ALL", "INVOICE", "PAYMENT", "RETURN", "OPENING"];
const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;
const MIDDAY_MS = 12 * 3_600_000;

export const DEFAULT_STATEMENT_FILTERS: StatementFilters = { type: "ALL", sort: "asc" };

function parseDay(value: string | undefined): string | undefined {
  if (!value || !DATE_ONLY.test(value)) return undefined;
  return Number.isNaN(shopDayStart(value).getTime()) ? undefined : value;
}

/** Reads statement filters from URL search params, dropping anything malformed back to its default. */
export function parseStatementFilters(params: { from?: string; to?: string; type?: string; sort?: string }): StatementFilters {
  return {
    from: parseDay(params.from),
    to: parseDay(params.to),
    type: TYPE_FILTERS.find((option) => option === params.type) ?? DEFAULT_STATEMENT_FILTERS.type,
    sort: params.sort === "desc" ? "desc" : DEFAULT_STATEMENT_FILTERS.sort,
  };
}

/** Serializes the non-default filters, so the print/copy page renders exactly what the tab shows. */
export function statementFilterParams(filters: StatementFilters): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.from) params.set("from", filters.from);
  if (filters.to) params.set("to", filters.to);
  if (filters.type !== DEFAULT_STATEMENT_FILTERS.type) params.set("type", filters.type);
  if (filters.sort !== DEFAULT_STATEMENT_FILTERS.sort) params.set("sort", filters.sort);
  return params;
}

/** The true running balance just before `fromTime` (0 when nothing precedes it), as a synthetic first row. */
function carriedForwardLine(statement: StatementLine[], fromTime: number): StatementLine {
  let balanceAfter = "0";
  for (const line of statement) {
    if (new Date(line.date).getTime() >= fromTime) break;
    balanceAfter = line.balanceAfter;
  }
  return {
    id: "carried-forward",
    // Midday of the from-day (shop time): renders as that same calendar day in any viewer/server timezone.
    date: new Date(fromTime + MIDDAY_MS).toISOString(),
    type: "OPENING",
    description: messages.partyStatement.carriedForward,
    debit: "0",
    credit: "0",
    balanceAfter,
    isCarriedForward: true,
  };
}

/**
 * Narrows a full, oldest-first statement to the requested period and movement type. Rows keep the
 * running balance computed over the whole account, and a "carried forward" row opens a period that
 * starts after the first movement so the balances still reconcile.
 */
export function applyStatementFilters(statement: StatementLine[], filters: StatementFilters): StatementLine[] {
  const fromTime = filters.from ? shopDayStart(filters.from).getTime() : undefined;
  const toTime = filters.to ? shopDayEnd(filters.to).getTime() : undefined;
  const rows = statement.filter((line) => {
    const time = new Date(line.date).getTime();
    if (fromTime !== undefined && time < fromTime) return false;
    if (toTime !== undefined && time >= toTime) return false;
    return filters.type === "ALL" || line.type === filters.type;
  });
  if (fromTime !== undefined) rows.unshift(carriedForwardLine(statement, fromTime));
  return filters.sort === "desc" ? rows.reverse() : rows;
}
