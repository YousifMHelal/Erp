import type { ReturnsListFilter, ReturnsSearchParams } from "@/types";

const SORTABLE = ["issuedAt", "number", "total"] as const;
const DIRECTIONS = ["asc", "desc"] as const;

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

export function returnsSearchParamsToFilter(params: ReturnsSearchParams): ReturnsListFilter {
  return {
    q: first(params.q),
    from: first(params.from),
    to: first(params.to),
    partyId: first(params.partyId),
    cashboxId: first(params.cashboxId),
    sortBy: oneOf(params.sortBy, SORTABLE) ?? "issuedAt",
    sortDirection: oneOf(params.sortDirection, DIRECTIONS) ?? "desc",
    page: Number(first(params.page) ?? 1) || 1,
    pageSize: Number(first(params.pageSize) ?? 20) || 20,
  };
}

export function returnsFilterToSearchParams(filter: ReturnsListFilter): URLSearchParams {
  const search = new URLSearchParams();
  const entries: [string, string | undefined][] = [
    ["q", filter.q],
    ["from", filter.from],
    ["to", filter.to],
    ["partyId", filter.partyId],
    ["cashboxId", filter.cashboxId],
    ["sortBy", filter.sortBy === "issuedAt" ? undefined : filter.sortBy],
    ["sortDirection", filter.sortDirection === "desc" ? undefined : filter.sortDirection],
    ["page", filter.page > 1 ? String(filter.page) : undefined],
    ["pageSize", filter.pageSize === 20 ? undefined : String(filter.pageSize)],
  ];
  for (const [key, value] of entries) if (value) search.set(key, value);
  return search;
}
