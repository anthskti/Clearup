"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { PRODUCT_PRICE_SLIDER_MAX } from "@/constants/productFilters";
import {
  EMPTY_PRODUCT_LIST_FILTERS,
  hasActiveProductListFilters,
  parseGlobalProductListFiltersFromSearchParams,
  parseProductListFiltersFromSearchParams,
  parseCatalogPage,
  productListFiltersToSearchParams,
  setProductPriceRange,
} from "@/lib/productListFilters";
import type {
  CatalogError,
  Product,
  ProductListFilters,
} from "@/types/product";

export type CatalogScope =
  | { type: "all" }
  | { type: "category"; slug: string };

function catalogBasePath(scope: CatalogScope): string {
  return scope.type === "all"
    ? "/products"
    : `/products/category/${scope.slug}`;
}

function queryFor(
  filters: ProductListFilters,
  search: string,
  page = 1,
): string {
  const query = productListFiltersToSearchParams(filters, search);
  if (page > 1) query.set("page", String(page));
  return query.toString();
}

function canonicalQuery(query: string): string {
  const params = new URLSearchParams(query);
  params.sort();
  return params.toString();
}

function normalizeQuery(
  params: URLSearchParams,
  scopeType: CatalogScope["type"],
  scopeSlug: string,
): string {
  const values = Object.fromEntries(params.entries());
  const filters = scopeType === "all"
    ? parseGlobalProductListFiltersFromSearchParams(values)
    : parseProductListFiltersFromSearchParams(values, scopeSlug);
  return queryFor(filters, values.search ?? "", parseCatalogPage(values.page));
}

interface UseProductCatalogOptions {
  scope: CatalogScope;
  initialProducts: Product[];
  initialTotal: number;
  initialFilters: ProductListFilters;
  initialSearch?: string;
  initialPage: number;
  catalogError: CatalogError | null;
  resultQuery: string;
}

export function useProductCatalog({
  scope,
  initialProducts,
  initialTotal,
  initialFilters,
  initialSearch = "",
  initialPage,
  catalogError,
  resultQuery,
}: UseProductCatalogOptions) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const scopeType = scope.type;
  const scopeSlug = scope.type === "category" ? scope.slug : "";
  const basePath = catalogBasePath(scope);
  const [filters, setFilters] = useState(initialFilters);
  const [draftPriceRange, setDraftPriceRange] = useState<[number, number]>([
    initialFilters.minPrice,
    initialFilters.maxPrice,
  ]);
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [inputValue, setInputValue] = useState(initialSearch);
  const [products, setProducts] = useState(initialProducts);
  const [totalCount, setTotalCount] = useState(initialTotal);
  const [page, setPage] = useState(initialPage);
  const [error, setError] = useState<CatalogError | null>(catalogError);
  const [retryNow, setRetryNow] = useState(0);
  const [isNavigating, setIsNavigating] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const queuedQuery = useRef<string | null>(null);
  const hasPendingNavigation = useRef(false);
  const navigationFromQuery = useRef("");
  const inputDraftVersion = useRef(0);
  const priceDraftVersion = useRef(0);
  const navigationDraftVersions = useRef({ input: 0, price: 0 });
  const committedQuery = normalizeQuery(
    new URLSearchParams(searchParams.toString()),
    scopeType,
    scopeSlug,
  );
  const committedIdentity = `${pathname}?${canonicalQuery(committedQuery)}`;
  const resultIdentity = `${basePath}?${canonicalQuery(resultQuery)}`;

  useEffect(() => {
    if (
      resultIdentity !== committedIdentity ||
      queuedQuery.current !== null ||
      (hasPendingNavigation.current && committedIdentity === navigationFromQuery.current)
    ) {
      return;
    }

    // Accept only data for the committed URL. A failed result keeps the last
    // successful rows and total visible.
    if (!catalogError) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setProducts(initialProducts);
      setTotalCount(initialTotal);
      setPage(initialPage);
    }
    setError(catalogError);
    setIsRetrying(false);
    hasPendingNavigation.current = false;
    setIsNavigating(false);
    setFilters(initialFilters);
    if (priceDraftVersion.current === navigationDraftVersions.current.price) {
      setDraftPriceRange([initialFilters.minPrice, initialFilters.maxPrice]);
    }
    setSearchQuery(initialSearch);
    if (inputDraftVersion.current === navigationDraftVersions.current.input) {
      setInputValue(initialSearch);
    }
  }, [
    resultQuery,
    resultIdentity,
    committedIdentity,
    initialProducts,
    initialTotal,
    initialPage,
    catalogError,
    initialFilters,
    initialSearch,
  ]);

  useEffect(() => {
    const onPopState = () => {
      if (timer.current) clearTimeout(timer.current);
      timer.current = null;
      queuedQuery.current = null;
      inputDraftVersion.current += 1;
      priceDraftVersion.current += 1;
      navigationDraftVersions.current = {
        input: inputDraftVersion.current,
        price: priceDraftVersion.current,
      };
      const nextQuery = normalizeQuery(
        new URLSearchParams(window.location.search),
        scopeType,
        scopeSlug,
      );
      const nextIdentity = `${window.location.pathname}?${canonicalQuery(nextQuery)}`;
      navigationFromQuery.current = committedIdentity;
      hasPendingNavigation.current = nextIdentity !== committedIdentity;
      setIsNavigating(nextIdentity !== committedIdentity);
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [committedIdentity, scopeType, scopeSlug]);

  useEffect(() => {
    if (!error?.retryAt) return;
    const wait = Math.max(0, error.retryAt - Date.now());
    const timeout = setTimeout(() => setRetryNow(Date.now()), wait);
    return () => clearTimeout(timeout);
  }, [error]);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const navigate = useCallback(
    (
      nextFilters: ProductListFilters,
      search: string,
      nextPage = 1,
      replace = false,
    ) => {
      if (timer.current) clearTimeout(timer.current);
      timer.current = null;
      queuedQuery.current = null;
      const query = queryFor(nextFilters, search, nextPage);
      navigationFromQuery.current = `${pathname}?${canonicalQuery(committedQuery)}`;
      navigationDraftVersions.current = {
        input: inputDraftVersion.current,
        price: priceDraftVersion.current,
      };
      const sameQuery = canonicalQuery(query) === canonicalQuery(committedQuery);
      setIsNavigating(!sameQuery);
      hasPendingNavigation.current = !sameQuery;
      if (sameQuery) return;
      const url = `${basePath}${query ? `?${query}` : ""}`;
      if (replace) router.replace(url, { scroll: false });
      else router.push(url, { scroll: false });
    },
    [basePath, committedQuery, pathname, router],
  );

  const scheduleFilterNavigation = useCallback(
    (nextFilters: ProductListFilters, search: string) => {
      if (timer.current) clearTimeout(timer.current);
      timer.current = null;
      const query = queryFor(nextFilters, search);
      queuedQuery.current = query;
      navigationFromQuery.current = `${pathname}?${canonicalQuery(committedQuery)}`;
      navigationDraftVersions.current = {
        input: inputDraftVersion.current,
        price: priceDraftVersion.current,
      };
      const sameQuery = canonicalQuery(query) === canonicalQuery(committedQuery);
      setIsNavigating(!sameQuery);
      hasPendingNavigation.current = !sameQuery;
      if (sameQuery) {
        queuedQuery.current = null;
        return;
      }
      timer.current = setTimeout(() => {
        timer.current = null;
        queuedQuery.current = null;
        hasPendingNavigation.current = true;
        const url = `${basePath}${query ? `?${query}` : ""}`;
        router.replace(url, { scroll: false });
      }, 250);
    },
    [basePath, committedQuery, pathname, router],
  );

  const updateFilters = useCallback(
    (next: ProductListFilters) => {
      setFilters(next);
      scheduleFilterNavigation(next, searchQuery);
    },
    [scheduleFilterNavigation, searchQuery],
  );

  const applyPriceFilter = useCallback(() => {
    const next = setProductPriceRange(filters, draftPriceRange);
    setFilters(next);
    navigate(next, searchQuery);
  }, [draftPriceRange, filters, navigate, searchQuery]);

  const updateDraftPriceRange = useCallback((range: [number, number]) => {
    priceDraftVersion.current += 1;
    setDraftPriceRange(range);
  }, []);

  const commitSearch = useCallback(
    (query: string) => {
      if (timer.current) clearTimeout(timer.current);
      const trimmed = query.trim();
      inputDraftVersion.current += 1;
      setInputValue(trimmed);
      setSearchQuery(trimmed);
      navigate(filters, trimmed);
    },
    [filters, navigate],
  );

  const onInputChange = useCallback((value: string) => {
    inputDraftVersion.current += 1;
    setInputValue(value);
  }, []);

  const clearAll = useCallback(() => {
    setFilters(EMPTY_PRODUCT_LIST_FILTERS);
    setDraftPriceRange([0, PRODUCT_PRICE_SLIDER_MAX]);
    setSearchQuery("");
    setInputValue("");
    navigate(EMPTY_PRODUCT_LIST_FILTERS, "");
  }, [navigate]);

  const retry = useCallback(() => {
    if (isRetrying || (error?.retryAt && retryNow < error.retryAt)) return;
    setIsRetrying(true);
    router.refresh();
  }, [error, isRetrying, retryNow, router]);

  const goToPage = useCallback(
    (nextPage: number) =>
      navigate(filters, searchQuery, Math.max(1, nextPage)),
    [filters, navigate, searchQuery],
  );

  const isFiltered = hasActiveProductListFilters(filters, searchQuery);
  const hasPriceDraftChanges =
    draftPriceRange[0] !== filters.minPrice ||
    draftPriceRange[1] !== filters.maxPrice;

  return {
    products,
    filters,
    updateFilters,
    draftPriceRange,
    setDraftPriceRange: updateDraftPriceRange,
    applyPriceFilter,
    hasPriceDraftChanges,
    inputValue,
    setInputValue: onInputChange,
    commitSearch,
    clearAll,
    isFiltered,
    totalCount,
    isNavigating,
    page,
    goToPage,
    error,
    retry,
    retryDisabled: isRetrying || Boolean(error?.retryAt && retryNow < error.retryAt),
    isRetrying,
  };
}
