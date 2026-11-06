import {
  fetchAllBrands,
  fetchProducts,
  ProductCatalogRequestError,
} from "@/lib/products";
import ProductListClient from "@/components/products/ProductListClient";
import { Metadata } from "next";
import {
  flattenSearchParams,
  parseGlobalProductListFiltersFromSearchParams,
  parseCatalogPage,
  productListFiltersToSearchParams,
  PRODUCT_CATALOG_PAGE_SIZE,
} from "@/lib/productListFilters";
import type { CatalogError, Product } from "@/types/product";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export const metadata: Metadata = {
  title: "All Products | Clearup",
  description: "Browse the full Clearup product catalog.",
};

export default async function AllProductsPage({ searchParams }: PageProps) {
  const flatParams = flattenSearchParams(await searchParams);
  const initialFilters =
    parseGlobalProductListFiltersFromSearchParams(flatParams);
  const initialSearch = flatParams.search ?? "";
  const page = parseCatalogPage(flatParams.page);
  const resultParams = productListFiltersToSearchParams(initialFilters, initialSearch);
  if (page > 1) resultParams.set("page", String(page));
  const resultQuery = resultParams.toString();

  let productsPage: { products: Product[]; total: number } = {
    products: [],
    total: 0,
  };
  let catalogError: CatalogError | null = null;
  try {
    productsPage = await fetchProducts(
      PRODUCT_CATALOG_PAGE_SIZE,
      (page - 1) * PRODUCT_CATALOG_PAGE_SIZE,
      {
        search: initialSearch || undefined,
        filters: initialFilters,
      },
    );
  } catch (error) {
    catalogError =
      error instanceof ProductCatalogRequestError
        ? error.catalogError
        : { status: null, requestId: null, retryAt: null };
  }
  let availableBrands: string[] = [];
  try {
    availableBrands = await fetchAllBrands();
  } catch {
    // Product results remain useful if the optional facet request is unavailable.
  }

  const lastPage = Math.max(1, Math.ceil(productsPage.total / PRODUCT_CATALOG_PAGE_SIZE));
  if (!catalogError && page > lastPage) {
    if (lastPage > 1) resultParams.set("page", String(lastPage));
    else resultParams.delete("page");
    redirect(`/products${resultParams.size ? `?${resultParams}` : ""}`);
  }

  const listKey = "all-products";

  return (
    <ProductListClient
      key={listKey}
      scope={{ type: "all" }}
      initialProducts={productsPage.products}
      initialTotal={productsPage.total}
      initialPage={page}
      catalogError={catalogError}
      resultQuery={resultQuery}
      initialFilters={initialFilters}
      initialSearch={initialSearch}
      availableBrands={availableBrands}
    />
  );
}
