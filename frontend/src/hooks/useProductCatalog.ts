"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { PRODUCT_PRICE_SLIDER_MAX } from "@/constants/productFilters";
import { useCatalogUrlNavigation } from "@/hooks/useCatalogUrlNavigation";
import {
  catalogBasePath,
  catalogIdentity,
  normalizeQuery,
  queryFor,
  type CatalogScope,
} from "@/lib/productCatalogUrl";
import {
  EMPTY_PRODUCT_LIST_FILTERS,
  hasActiveProductListFilters,
  setProductPriceRange,
} from "@/lib/productListFilters";
import type {
  CatalogError,
  Product,
  ProductListFilters,
} from "@/types/product";

export type { CatalogScope };

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
  const [isRetrying, setIsRetrying] = useState(false);
  const paginationTarget = useRef<number | null>(null);
  const scrollToPage = useRef<number | null>(null);

  // Draft version guards: only overwrite search/price drafts from SSR when the
  // user has not edited them since navigation started.
  const inputDraftVersion = useRef(0);
  const priceDraftVersion = useRef(0);
  const versionsAtNavStart = useRef({ input: 0, price: 0 });

  const snapshotDraftVersions = useCallback(() => {
    versionsAtNavStart.current = {
      input: inputDraftVersion.current,
      price: priceDraftVersion.current,
    };
  }, []);

  const bumpDraftVersionsForHistory = useCallback(() => {
    paginationTarget.current = null;
    scrollToPage.current = null;
    inputDraftVersion.current += 1;
    priceDraftVersion.current += 1;
    snapshotDraftVersions();
  }, [snapshotDraftVersions]);

  const committedQuery = normalizeQuery(
    new URLSearchParams(searchParams.toString()),
    scopeType,
    scopeSlug,
  );
  const committedIdentity = catalogIdentity(pathname, committedQuery);
  const resultIdentity = catalogIdentity(basePath, resultQuery);

  const {
    isNavigating,
    navigateNow,
    scheduleReplace,
    cancelScheduled,
    shouldAcceptServerResult,
    markSettled,
  } = useCatalogUrlNavigation({
    basePath,
    committedQuery,
    onBeginNavigation: snapshotDraftVersions,
    onBrowserHistoryChange: bumpDraftVersionsForHistory,
  });

  useEffect(() => {
    if (!shouldAcceptServerResult(resultIdentity, committedIdentity)) {
      return;
    }

    // Accept only data for the committed URL. A failed result keeps the last
    // successful rows and total visible.
    if (!catalogError) {
      const userPageCommit =
        paginationTarget.current !== null && initialPage !== page;
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setProducts(initialProducts);
      setTotalCount(initialTotal);
      setPage(initialPage);
      if (userPageCommit) scrollToPage.current = initialPage;
    } else {
      scrollToPage.current = null;
    }
    paginationTarget.current = null;
    setError(catalogError);
    setIsRetrying(false);
    markSettled();
    setFilters(initialFilters);
    if (priceDraftVersion.current === versionsAtNavStart.current.price) {
      setDraftPriceRange([initialFilters.minPrice, initialFilters.maxPrice]);
    }
    setSearchQuery(initialSearch);
    if (inputDraftVersion.current === versionsAtNavStart.current.input) {
      setInputValue(initialSearch);
    }
  }, [
    resultQuery,
    resultIdentity,
    committedIdentity,
    initialProducts,
    initialTotal,
    initialPage,
    page,
    catalogError,
    initialFilters,
    initialSearch,
    shouldAcceptServerResult,
    markSettled,
  ]);

  useEffect(() => {
    if (scrollToPage.current === null || page !== scrollToPage.current) return;
    const heading = document.getElementById("product-results-heading");
    if (!heading) return;

    const top = Math.max(
      0,
      window.scrollY + heading.getBoundingClientRect().top - 72,
    );
    window.scrollTo({ top, behavior: "auto" });
    heading.focus({ preventScroll: true });
    scrollToPage.current = null;
  }, [page, products]);

  useEffect(() => {
    if (!error?.retryAt) return;
    const wait = Math.max(0, error.retryAt - Date.now());
    const timeout = setTimeout(() => setRetryNow(Date.now()), wait);
    return () => clearTimeout(timeout);
  }, [error]);

  const navigate = useCallback(
    (
      nextFilters: ProductListFilters,
      search: string,
      nextPage = 1,
      replace = false,
      isPageRequest = false,
    ) => {
      if (!isPageRequest) {
        paginationTarget.current = null;
        scrollToPage.current = null;
      }
      navigateNow(queryFor(nextFilters, search, nextPage), replace);
    },
    [navigateNow],
  );

  const updateFilters = useCallback(
    (next: ProductListFilters) => {
      paginationTarget.current = null;
      scrollToPage.current = null;
      setFilters(next);
      scheduleReplace(queryFor(next, searchQuery));
    },
    [scheduleReplace, searchQuery, setFilters],
  );

  const applyPriceFilter = useCallback(() => {
    const next = setProductPriceRange(filters, draftPriceRange);
    setFilters(next);
    navigate(next, searchQuery);
  }, [draftPriceRange, filters, navigate, searchQuery, setFilters]);

  const updateDraftPriceRange = useCallback(
    (range: [number, number]) => {
      priceDraftVersion.current += 1;
      setDraftPriceRange(range);
    },
    [setDraftPriceRange],
  );

  const commitSearch = useCallback(
    (query: string) => {
      cancelScheduled();
      const trimmed = query.trim();
      inputDraftVersion.current += 1;
      setInputValue(trimmed);
      setSearchQuery(trimmed);
      navigate(filters, trimmed);
    },
    [cancelScheduled, filters, navigate, setInputValue, setSearchQuery],
  );

  const onInputChange = useCallback(
    (value: string) => {
      inputDraftVersion.current += 1;
      setInputValue(value);
    },
    [setInputValue],
  );

  const clearFilters = useCallback(() => {
    setFilters(EMPTY_PRODUCT_LIST_FILTERS);
    setDraftPriceRange([0, PRODUCT_PRICE_SLIDER_MAX]);
    navigate(EMPTY_PRODUCT_LIST_FILTERS, searchQuery);
  }, [navigate, searchQuery, setDraftPriceRange, setFilters]);

  const retry = useCallback(() => {
    if (isRetrying || (error?.retryAt && retryNow < error.retryAt)) return;
    setIsRetrying(true);
    router.refresh();
  }, [error, isRetrying, retryNow, router, setIsRetrying]);

  const goToPage = useCallback(
    (nextPage: number) => {
      if (isNavigating || nextPage === page) return;
      const targetPage = Math.max(1, nextPage);
      paginationTarget.current = targetPage;
      navigate(filters, searchQuery, targetPage, false, true);
    },
    [filters, isNavigating, navigate, page, searchQuery],
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
    searchQuery,
    setInputValue: onInputChange,
    commitSearch,
    clearFilters,
    isFiltered,
    totalCount,
    isNavigating,
    page,
    goToPage,
    error,
    retry,
    retryDisabled:
      isRetrying || Boolean(error?.retryAt && retryNow < error.retryAt),
    isRetrying,
  };
}
