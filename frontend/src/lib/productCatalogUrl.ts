import {
  parseGlobalProductListFiltersFromSearchParams,
  parseProductListFiltersFromSearchParams,
  productListFiltersToSearchParams,
  PRODUCT_CATALOG_PAGE_SIZE,
} from "@/lib/productListFilters";
import { parsePageParam } from "@/lib/pagination";
import type { ProductListFilters } from "@/types/product";

export type CatalogScope =
  | { type: "all" }
  | { type: "category"; slug: string };

export function catalogBasePath(scope: CatalogScope): string {
  return scope.type === "all"
    ? "/products"
    : `/products/category/${scope.slug}`;
}

export function queryFor(
  filters: ProductListFilters,
  search: string,
  page = 1,
): string {
  const query = productListFiltersToSearchParams(filters, search);
  if (page > 1) query.set("page", String(page));
  return query.toString();
}

export function canonicalQuery(query: string): string {
  const params = new URLSearchParams(query);
  params.sort();
  return params.toString();
}

export function normalizeQuery(
  params: URLSearchParams,
  scopeType: CatalogScope["type"],
  scopeSlug: string,
): string {
  const values = Object.fromEntries(params.entries());
  const pageValues = params.getAll("page");
  const filters =
    scopeType === "all"
      ? parseGlobalProductListFiltersFromSearchParams(values)
      : parseProductListFiltersFromSearchParams(values, scopeSlug);
  return queryFor(
    filters,
    values.search ?? "",
    parsePageParam(
      pageValues.length === 1 ? pageValues[0] : undefined,
      PRODUCT_CATALOG_PAGE_SIZE,
    ),
  );
}

export function catalogIdentity(path: string, query: string): string {
  return `${path}?${canonicalQuery(query)}`;
}

export function queriesEqual(a: string, b: string): boolean {
  return canonicalQuery(a) === canonicalQuery(b);
}
