import PAGINATION from "../config/pagination";

export const MAX_PRODUCT_PAGE_SIZE = 100;

function unsignedInteger(value: unknown, fallback: number): number | null {
  if (value === undefined) return fallback;
  if (typeof value !== "string" || !/^\d+$/.test(value)) return null;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) ? parsed : null;
}

/** Reject malformed or repeated query parameters before they reach a query. */
export function parseProductPagination(query: Record<string, unknown>):
  | { limit: number; offset: number }
  | null {
  const limit = unsignedInteger(query.limit, PAGINATION.LIMIT);
  const offset = unsignedInteger(query.offset, PAGINATION.OFFSET);
  if (limit === null || limit < 1 || limit > MAX_PRODUCT_PAGE_SIZE || offset === null) return null;
  return { limit, offset };
}
