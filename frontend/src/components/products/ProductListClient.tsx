"use client";
import { useEffect, useState } from "react";
import ProductImage from "@/components/ui/ProductImage";
import Link from "next/link";
import { Search, SlidersHorizontal, X } from "lucide-react";
import ProductRating from "@/components/product/ProductRating";
import { CountryMapping } from "../../constants/CountryMapping";

import {
  CATEGORY_CONFIG,
  ALL_PRODUCTS_CONFIG,
  CategoryKey,
  type ColumnConfig,
} from "@/constants/filters";
import ProceduralWave from "@/components/themes/ProceduralWave";
import type { CatalogError, Product, ProductListFilters } from "@/types/product";
import AddToRoutineButton from "@/components/routine/AddToRoutineButton";
import { SkinTypeTags } from "./SkinTypeTags";
import ProductListFiltersSidebar from "./ProductListFiltersSidebar";
import ProductFiltersSheet from "./ProductFiltersSheet";
import ProductCatalogPagination from "./ProductCatalogPagination";
import MerchantOffersNotice from "./MerchantOffersNotice";
import { getCatalogMerchantOffersByProductIds } from "@/lib/catalogMerchantOffers";
import { pickLowestPriceOffer } from "@/lib/products";
import {
  type CatalogScope,
  useProductCatalog,
} from "@/hooks/useProductCatalog";
import { PRODUCT_PRICE_SLIDER_MAX } from "@/constants/productFilters";
import { formatPriceRangeLabel } from "@/lib/priceRange";
import {
  EMPTY_PRODUCT_LIST_FILTERS,
  setProductPriceRange,
  PRODUCT_CATALOG_PAGE_SIZE,
  skinTypeLabel,
  toggleAttributeFilter,
  toggleBrandFilter,
  toggleSkinTypeFilter,
} from "@/lib/productListFilters";

interface ProductListClientProps {
  scope: CatalogScope;
  initialProducts: Product[];
  initialTotal: number;
  initialFilters: ProductListFilters;
  initialSearch?: string;
  initialPage: number;
  catalogError: import("@/types/product").CatalogError | null;
  resultQuery: string;
  availableBrands: string[];
}

function getProductThumbUrl(product: Product): string | null {
  const url = product.imageUrls?.[0]?.trim();
  return url ? url : null;
}

function getActiveFilterCount(filters: ProductListFilters): number {
  return (
    filters.skinTypes.length +
    filters.brands.length +
    Object.values(filters.attributes).reduce(
      (count, values) => count + values.length,
      0,
    ) +
    Number(
      filters.minPrice > 0 || filters.maxPrice < PRODUCT_PRICE_SLIDER_MAX,
    )
  );
}

const activeFilterTagClassName =
  "inline-flex min-h-9 items-center gap-1.5 rounded-full border border-zinc-200 bg-white px-3 text-sm text-zinc-700 hover:border-zinc-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0e4a84] xl:min-h-8 xl:gap-1 xl:border-transparent xl:bg-zinc-100 xl:px-2.5 xl:text-xs xl:hover:bg-zinc-200";

export default function ProductListClient({
  scope,
  initialProducts,
  initialTotal,
  initialFilters,
  initialSearch = "",
  initialPage,
  catalogError,
  resultQuery,
  availableBrands,
}: ProductListClientProps) {
  const [offerPrices, setOfferPrices] = useState<Record<number, number | null>>(
    {},
  );
  const [offerRetryVersion, setOfferRetryVersion] = useState(0);
  const [offerFailure, setOfferFailure] = useState<{
    productKey: string;
    error: CatalogError;
    isRetrying: boolean;
  } | null>(null);
  const {
    products,
    filters,
    updateFilters,
    draftPriceRange,
    setDraftPriceRange,
    applyPriceFilter,
    hasPriceDraftChanges,
    inputValue,
    setInputValue,
    searchQuery,
    commitSearch,
    clearFilters,
    isFiltered,
    totalCount,
    isNavigating,
    page,
    goToPage,
    error,
    retry,
    retryDisabled,
    isRetrying,
  } = useProductCatalog({
    scope,
    initialProducts,
    initialTotal,
    initialFilters,
    initialSearch,
    initialPage,
    catalogError,
    resultQuery,
  });
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);
  const [mobileFilters, setMobileFilters] = useState(filters);
  const [mobilePriceRange, setMobilePriceRange] = useState<[number, number]>([
    filters.minPrice,
    filters.maxPrice,
  ]);

  const productKey = products.map((product) => product.id).join(",");
  const currentOfferFailure = offerFailure?.productKey === productKey ? offerFailure : null;

  useEffect(() => {
    const controller = new AbortController();
    const productIds = products.map((product) => product.id);
    if (!productIds.length) return;

    void getCatalogMerchantOffersByProductIds(productIds, { signal: controller.signal }).then(({ offers, error: offerError }) => {
      if (controller.signal.aborted) return;
      setOfferPrices((previous) => ({
        ...previous,
        ...Object.fromEntries(
          productIds.filter((id) => offers[id] !== undefined).map((productId) => [
            productId,
            pickLowestPriceOffer(offers[productId] ?? [])?.price ??
              null,
          ]),
        ),
      }));
      setOfferFailure(offerError ? { productKey, error: offerError, isRetrying: false } : null);
    }).catch((error: unknown) => {
      if (controller.signal.aborted) return;
      console.error("Catalog merchant offers failed", error);
      setOfferFailure({ productKey, error: { status: null, requestId: null, retryAt: null }, isRetrying: false });
    });

    return () => {
      controller.abort();
    };
  }, [products, productKey, offerRetryVersion]);

  const retryOffers = () => {
    if (currentOfferFailure?.isRetrying) return;
    setOfferFailure((previous) => previous ? { ...previous, isRetrying: true } : null);
    setOfferRetryVersion((previous) => previous + 1);
  };

  const config =
    scope.type === "all"
      ? ALL_PRODUCTS_CONFIG
      : CATEGORY_CONFIG[scope.slug as CategoryKey] || CATEGORY_CONFIG.default;

  const activeFilterCount = getActiveFilterCount(filters);
  const mobileFilterCount = getActiveFilterCount(mobileFilters);

  const applyFilters = (next: ProductListFilters) => {
    updateFilters(next);
    setDraftPriceRange([next.minPrice, next.maxPrice]);
  };

  const openFilterSheet = () => {
    setMobileFilters(filters);
    setMobilePriceRange([filters.minPrice, filters.maxPrice]);
    setIsFilterSheetOpen(true);
  };

  const clearMobileFilters = () => {
    setMobileFilters(EMPTY_PRODUCT_LIST_FILTERS);
    setMobilePriceRange([0, PRODUCT_PRICE_SLIDER_MAX]);
  };

  const applyMobileFilters = () => {
    applyFilters(mobileFilters);
    setIsFilterSheetOpen(false);
  };

  const resolveRoutineCategory = (product: Product) =>
    scope.type === "all" ? product.category : scope.slug;

  type CellVariant = "desktop" | "mobile";

  const renderCellContent = (
    col: ColumnConfig,
    product: Product,
    variant: CellVariant = "desktop",
  ) => {
    const labelIndexMap: Record<string, number> = {
      texture: 0, // Cleansers & Moisturizers
      benefits: 0, // Toners
      effect: 0, // Essences
      ac: 0, // Serums
      spf: 0, // Sunscreens
      concern: 0, // Eyecare
      concentration: 1, // Serums
      finish: 1, // Sunscreens & Moisturizer
      format: 1, // Toners
      filter: 2, // Sunscreens
    };

    if (col.id in labelIndexMap) {
      const index = labelIndexMap[col.id];
      // Safety check: ensure labels exist and the index is valid
      const value = product.labels?.[index] || "—";

      return (
        <span className="text-[12px] text-zinc-700 capitalize">{value}</span>
      );
    }

    switch (col.id) {
      case "name": {
        const thumb = getProductThumbUrl(product);
        return (
          <div className="flex min-w-0 items-center gap-2.5">
            {thumb ? (
              <ProductImage
                src={thumb}
                alt={product.name}
                width={44}
                height={44}
                className="h-11 w-11 bg-gray-200 rounded-md shrink-0 object-cover"
              />
            ) : (
              <div
                className="h-11 w-11 shrink-0 rounded-md border border-zinc-200 bg-zinc-100"
                aria-hidden
              />
            )}
            <Link
              href={`/product/id/${product.id}`}
              prefetch={false}
              title={`${product.brand} ${product.name}`}
              className="line-clamp-2 min-w-0 text-sm leading-5"
            >
              <span className="font-medium text-zinc-600">{product.brand}</span>
              <span
                aria-hidden="true"
                className="mx-1 mb-[0.12em] inline-block size-0.5 shrink-0 rounded-full bg-zinc-500 align-middle"
              />
              <span className="font-semibold text-zinc-900">
                {product.name}
              </span>
            </Link>
          </div>
        );
      }
      case "country": {
        if (variant === "mobile") {
          return (
            <span className="text-[12px] text-zinc-700">
              {product.country?.trim() || "—"}
            </span>
          );
        }
        const flagUrl = CountryMapping[product.country]?.trim();
        const flagBox =
          "relative box-border flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-md border border-zinc-200 bg-white";
        return flagUrl ? (
          <div className="flex justify-center">
            <div className={flagBox} title={product.country}>
              {/* Local SVG flags vary in aspect ratio; fixed square + object-contain */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={flagUrl}
                alt={product.country}
                className="h-full w-full object-cover p-1"
              />
            </div>
          </div>
        ) : (
          <div className="flex justify-center" aria-hidden>
            <div className="h-10 w-10 shrink-0 rounded-md border border-zinc-200 bg-zinc-100" />
          </div>
        );
      }
      case "price":
        return (
          <span className="font-bold text-zinc-900 block">
            {offerPrices[product.id] == null
              ? "-"
              : `$${offerPrices[product.id]!.toFixed(2)}`}
          </span>
        );
      case "add":
        return (
          <AddToRoutineButton
            product={product}
            category={resolveRoutineCategory(product)}
            compact={true}
            size="sm"
          />
        );
      case "category":
        return (
          <Link
            href={`/products/category/${product.category}`}
            prefetch={false}
            className="text-[12px] font-semibold capitalize text-[#0e4a84]"
          >
            {product.category}
          </Link>
        );
      case "rating": {
        return (
          <ProductRating
            averageRating={product.averageRating}
            reviewCount={product.reviewCount}
            variant="compact"
            align={variant === "mobile" ? "start" : "center"}
          />
        );
      }
      // Default: Just render the default
      default:
        const val = product[col.id as keyof Product];

        if (Array.isArray(val)) {
          if (val.length === 0)
            return <span className="text-[12px] text-zinc-400">—</span>;

          if (col.id === "skinType") {
            return <SkinTypeTags skinTypes={val.map(String)} variant={variant} />;
          }

          const firstItem = val[0];
          const remainingCount = val.length - 1;

          return (
            <div className="flex items-center gap-1.5">
              {/* First Tag */}
              <span className="px-2 py-0.5 bg-zinc-100 text-zinc-700 text-xs font-medium rounded-md border border-zinc-200 whitespace-nowrap">
                {firstItem}
              </span>

              {/* +N Badge */}
              {remainingCount > 0 && (
                <div
                  className="px-1.5 py-0.5 bg-zinc-50 text-zinc-500 text-[10px] font-bold rounded-md border border-zinc-200 cursor-help hover:bg-zinc-200 hover:text-zinc-700 transition-colors"
                  title={val.slice(1).join(", ")}
                >
                  +{remainingCount}
                </div>
              )}
            </div>
          );
        }

        // If it's just a normal string or number
        return (
          <span className="text-[12px] text-zinc-900">
            {val as React.ReactNode}
          </span>
        );
    }
  };
  const mobileAttrColumns = config.tableColumns.filter(
    (col) => col.id !== "name" && col.id !== "add" && col.id !== "price",
  );
  const priceColumn = config.tableColumns.find((col) => col.id === "price");
  const nameColumn = config.tableColumns.find((col) => col.id === "name");
  const addColumn = config.tableColumns.find((col) => col.id === "add");

  const emptyState = (
    <div className="p-12 text-center text-sm text-zinc-500">
      <p className="font-medium text-zinc-700">{error ? "Products couldn’t be loaded" : "No products found"}</p>
      <p className="mt-1">
        {error ? "Retry when the service is available." : isFiltered
          ? "Try adjusting your filters or search."
          : "No products here yet."}
      </p>
      {activeFilterCount > 0 && (
        <button
          type="button"
          onClick={clearFilters}
          className="mt-4 font-semibold text-[#0e4a84] underline-offset-4 hover:underline"
        >
          Clear filters
        </button>
      )}
      {searchQuery && (
        <button
          type="button"
          onClick={() => commitSearch("")}
          className="mt-4 ml-4 font-semibold text-[#0e4a84] underline-offset-4 hover:underline"
        >
          Clear search
        </button>
      )}
    </div>
  );

  return (
    <div className="relative mt-18 min-h-screen bg-[#F8F8F8] pt-8">
      <ProceduralWave 
        seed={6}
        height={190} 
        frequency={1.5}
        gradientFrom="#e9f6ff" 
        gradientTo="#f0f8fc" 
        flip={true} 
      />
      <div className="relative z-1 mx-auto max-w-7xl px-4 sm:px-6 xl:grid xl:grid-cols-[240px_minmax(0,1fr)] xl:items-start xl:gap-x-6">
        <header className="mb-3 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between xl:col-span-2 xl:mb-3">
          <h1 className="text-2xl font-bold text-zinc-900 sm:text-3xl">
            {config.category}
          </h1>
          <div className="w-full sm:max-w-md">
            <form
              role="search"
              onSubmit={(event) => {
                event.preventDefault();
                commitSearch(inputValue);
              }}
              className="flex w-full gap-2"
            >
              <label htmlFor="product-search" className="sr-only">
                Search products
              </label>
              <div className="relative min-w-0 flex-1">
                <Search
                  aria-hidden="true"
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
                  size={16}
                />
                <input
                  id="product-search"
                  type="search"
                  placeholder="Search products"
                  value={inputValue}
                  onChange={(event) => setInputValue(event.target.value)}
                  className="h-11 w-full rounded-md border border-zinc-200 bg-white py-2.5 pl-10 pr-3 text-sm outline-none focus:border-[#0e4a84] focus:ring-2 focus:ring-[#0e4a84]/15"
                />
              </div>
              <button
                type="submit"
                className="inline-flex h-11 shrink-0 items-center gap-2 rounded-md bg-[#0e4a84] px-4 text-sm font-semibold text-white hover:bg-[#0a345c] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0e4a84]"
              >
                Search
              </button>
            </form>
            <p className="mt-3 hidden text-right text-sm font-medium text-zinc-500 xl:block">
              Showing {totalCount === 0 || products.length === 0 ? 0 : (page - 1) * PRODUCT_CATALOG_PAGE_SIZE + 1}–{(page - 1) * PRODUCT_CATALOG_PAGE_SIZE + products.length} of {totalCount} results
            </p>
          </div>
        </header>

        <div className="mb-4 flex items-center justify-between gap-3 xl:hidden">
          <button
            type="button"
            onClick={openFilterSheet}
            aria-haspopup="dialog"
            aria-expanded={isFilterSheetOpen}
            className="inline-flex h-11 items-center gap-2 rounded-md border border-zinc-300 bg-white px-4 text-sm font-semibold text-zinc-800 hover:bg-zinc-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0e4a84] xl:hidden"
          >
            <SlidersHorizontal size={17} aria-hidden="true" />
            Filters
            {activeFilterCount > 0 && (
              <span className="rounded-full bg-[#0e4a84] px-2 py-0.5 text-xs text-white">
                {activeFilterCount}
              </span>
            )}
          </button>
          <p className="ml-auto text-sm font-medium text-zinc-500">
            Showing {totalCount === 0 || products.length === 0 ? 0 : (page - 1) * PRODUCT_CATALOG_PAGE_SIZE + 1}–{(page - 1) * PRODUCT_CATALOG_PAGE_SIZE + products.length} of {totalCount} results
          </p>
        </div>

        {activeFilterCount > 0 && (
          <div className="mb-5 flex flex-wrap gap-2 xl:col-span-2 xl:mb-3 xl:gap-1.5" aria-label="Active filters">
            {filters.skinTypes.map((skinType) => (
              <button
                key={`skin-${skinType}`}
                type="button"
                onClick={() => applyFilters(toggleSkinTypeFilter(filters, skinType))}
                aria-label={`Remove skin type filter: ${skinTypeLabel(skinType)}`}
                className={activeFilterTagClassName}
              >
                Skin type: {skinTypeLabel(skinType)} <X size={14} className="xl:size-3" aria-hidden="true" />
              </button>
            ))}
            {filters.brands.map((brand) => (
              <button
                key={`brand-${brand}`}
                type="button"
                onClick={() => applyFilters(toggleBrandFilter(filters, brand))}
                aria-label={`Remove brand filter: ${brand}`}
                className={activeFilterTagClassName}
              >
                Brand: {brand} <X size={14} className="xl:size-3" aria-hidden="true" />
              </button>
            ))}
            {Object.entries(filters.attributes).flatMap(([id, values]) => {
              const label = config.specificFilters.find((filter) => filter.id === id)?.labels ?? id;
              return values.map((value) => (
                <button
                  key={`${id}-${value}`}
                  type="button"
                  onClick={() => applyFilters(toggleAttributeFilter(filters, id, value))}
                  aria-label={`Remove ${label} filter: ${value}`}
                  className={activeFilterTagClassName}
                >
                  {label}: {value} <X size={14} className="xl:size-3" aria-hidden="true" />
                </button>
              ));
            })}
            {(filters.minPrice > 0 || filters.maxPrice < PRODUCT_PRICE_SLIDER_MAX) && (
              <button
                type="button"
                onClick={() => applyFilters(setProductPriceRange(filters, [0, PRODUCT_PRICE_SLIDER_MAX]))}
                aria-label="Remove price filter"
                className={activeFilterTagClassName}
              >
                Price: {formatPriceRangeLabel([filters.minPrice, filters.maxPrice], PRODUCT_PRICE_SLIDER_MAX)}
                <X size={14} className="xl:size-3" aria-hidden="true" />
              </button>
            )}
          </div>
        )}

        <aside aria-label="Product filters" className="hidden xl:block">
          <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
            <div className="flex h-11 items-center justify-between border-b border-zinc-200 bg-zinc-50 px-4">
              <h2 className="text-xs font-medium text-zinc-500">Filters</h2>
              {activeFilterCount > 0 && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="text-sm font-medium text-[#0e4a84] underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0e4a84]"
                >
                  Clear
                </button>
              )}
            </div>
            <div className="px-4 pb-1">
              <ProductListFiltersSidebar
                instanceId="desktop"
                appearance="rail"
                scope={scope}
                filters={filters}
                onFiltersChange={applyFilters}
                draftPriceRange={draftPriceRange}
                onDraftPriceChange={setDraftPriceRange}
                onApplyPrice={applyPriceFilter}
                hasPriceDraftChanges={hasPriceDraftChanges}
                availableBrands={availableBrands}
              />
            </div>
          </div>
        </aside>

        <main className="min-w-0">
          {error && (
            <div role="alert" className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950">
              Couldn’t load this page.{products.length > 0 ? " Showing your previous results." : ""}
              {error.status ? ` (HTTP ${error.status})` : ""}
              <button className="underline disabled:opacity-50" disabled={retryDisabled} onClick={retry}>
                {retryDisabled ? "Retry available shortly" : "Retry"}
              </button>
            </div>
          )}
          {currentOfferFailure && <MerchantOffersNotice error={currentOfferFailure.error} isRetrying={currentOfferFailure.isRetrying} onRetry={retryOffers} />}
          {isNavigating && <p role="status" className="sr-only">Updating results…</p>}
          <ProductFiltersSheet
            open={isFilterSheetOpen}
            onOpenChange={setIsFilterSheetOpen}
            activeFilterCount={mobileFilterCount}
            onClear={clearMobileFilters}
            onApply={applyMobileFilters}
          >
            <ProductListFiltersSidebar
              instanceId="mobile"
              scope={scope}
              filters={mobileFilters}
              onFiltersChange={setMobileFilters}
              draftPriceRange={mobilePriceRange}
              onDraftPriceChange={(range) => {
                setMobilePriceRange(range);
                setMobileFilters((current) => setProductPriceRange(current, range));
              }}
              onApplyPrice={() => {}}
              hasPriceDraftChanges={false}
              availableBrands={availableBrands}
              appearance="sheet"
              showPriceApply={false}
            />
          </ProductFiltersSheet>

          {/* Mobile: card list */}
          <div className="mb-10 space-y-3 lg:hidden">
            {products.length === 0 ? (
              <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm">
                {emptyState}
              </div>
            ) : (
              products.map((product) => (
                <article
                  key={product.id}
                  className="rounded-lg border border-zinc-200 bg-white p-3 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-2.5">
                    <div className="min-w-0 flex-1">
                      {nameColumn &&
                        renderCellContent(nameColumn, product, "mobile")}
                    </div>
                    <div className="shrink-0">
                      {addColumn &&
                        renderCellContent(addColumn, product, "mobile")}
                    </div>
                  </div>
                  <dl className="mt-3 grid grid-cols-3 gap-x-2.5 gap-y-3 border-t border-zinc-100 pt-3">
                    {mobileAttrColumns.map((col) => (
                      <div
                        key={`${product.id}-mobile-${col.id}`}
                        className={col.id === "skinType" ? "col-span-3 min-w-0" : "min-w-0"}
                      >
                        <dt className="text-[11px] font-medium leading-4 text-zinc-500">
                          {col.labels || col.id}
                        </dt>
                        <dd className="mt-0.5 text-left [&>*]:justify-start">
                          {renderCellContent(col, product, "mobile")}
                        </dd>
                      </div>
                    ))}
                  </dl>
                  {priceColumn && (
                    <div className="mt-3 border-t border-zinc-100 pt-2.5">
                      {renderCellContent(priceColumn, product, "mobile")}
                    </div>
                  )}
                </article>
              ))
            )}
          </div>

          {/* Desktop: table */}
          <div className="mb-10 hidden overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm lg:block">
            <div className="grid h-11 grid-cols-12 items-center border-b border-zinc-200 bg-zinc-50 px-4 text-xs font-medium text-zinc-500">
              {config.tableColumns.map((col) => (
                <div key={col.id} className={`${col.width} px-1`}>
                  {col.labels}
                </div>
              ))}
            </div>

            <div className="divide-y divide-zinc-100">
              {products.length === 0
                ? emptyState
                : products.map((product) => (
                    <div
                      key={product.id}
                      className="group grid grid-cols-12 items-center px-4 py-3 transition-colors hover:bg-blue-50/30"
                    >
                      {config.tableColumns.map((col) => (
                        <div
                          key={`${product.id}-${col.id}`}
                          className={`${col.width} px-1`}
                        >
                          {renderCellContent(col, product, "desktop")}
                        </div>
                      ))}
                    </div>
                  ))}
            </div>
          </div>

          <ProductCatalogPagination
            page={page}
            total={totalCount}
            onPage={goToPage}
            disabled={isNavigating || retryDisabled || isRetrying}
          />
        </main>
      </div>
    </div>
  );
}
