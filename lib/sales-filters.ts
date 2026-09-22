import type { SalesListFilter, SalesSearchParams } from "@/types";

const SORTABLE = ["issuedAt", "number", "total"] as const;
const DIRECTIONS = ["asc", "desc"] as const;
const PAYMENT_STATUSES = ["PAID", "PARTIAL", "UNPAID"] as const;

function first(value: string | string[] | undefined): string | undefined {
  const raw = Array.isArray(value) ? value[0] : value;
  const trimmed = raw?.trim();
  return trimmed ? trimmed : undefined;
}

function oneOf<T extends string>(
  value: string | string[] | undefined,
  allowed: readonly T[],
): T | undefined {
  const raw = first(value);
  return raw && (allowed as readonly string[]).includes(raw) ? (raw as T) : undefined;
}

/**
 * Maps raw URL search params to the shape `salesFilterSchema` expects. Values are
 * left as strings — the schema on the server is the one that validates and coerces,
 * so a hand-edited URL can never widen what the query actually runs.
 */
export function salesSearchParamsToFilter(
  params: SalesSearchParams,
): SalesListFilter {
  return {
    q: first(params.q),
    from: first(params.from),
    to: first(params.to),
    customerId: first(params.customerId),
    cashboxId: first(params.cashboxId),
    paymentStatus: oneOf(params.paymentStatus, PAYMENT_STATUSES),
    userId: first(params.userId),
    sortBy: oneOf(params.sortBy, SORTABLE) ?? "issuedAt",
    sortDirection: oneOf(params.sortDirection, DIRECTIONS) ?? "desc",
    page: Number(first(params.page) ?? 1) || 1,
    pageSize: Number(first(params.pageSize) ?? 20) || 20,
  };
}

/** Serialises a filter back to a query string, dropping empty and default values. */
export function salesFilterToSearchParams(
  filter: SalesListFilter,
): URLSearchParams {
  const search = new URLSearchParams();
  const entries: [string, string | undefined][] = [
    ["q", filter.q],
    ["from", filter.from],
    ["to", filter.to],
    ["customerId", filter.customerId],
    ["cashboxId", filter.cashboxId],
    ["paymentStatus", filter.paymentStatus],
    ["userId", filter.userId],
    ["sortBy", filter.sortBy === "issuedAt" ? undefined : filter.sortBy],
    ["sortDirection", filter.sortDirection === "desc" ? undefined : filter.sortDirection],
    ["page", filter.page > 1 ? String(filter.page) : undefined],
    ["pageSize", filter.pageSize === 20 ? undefined : String(filter.pageSize)],
  ];
  for (const [key, value] of entries) if (value) search.set(key, value);
  return search;
}
