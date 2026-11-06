import {
  fetchCategoryBrands,
  fetchProductsByCategory,
  ProductCatalogRequestError,
} from "@/lib/products";
import ProductListClient from "@/components/products/ProductListClient";
import { Metadata } from "next";
import {
  flattenSearchParams,
  parseProductListFiltersFromSearchParams,
  productListFiltersToSearchParams,
  PRODUCT_CATALOG_PAGE_SIZE,
} from "@/lib/productListFilters";
import { parsePageParam } from "@/lib/pagination";
import type { CatalogError, Product } from "@/types/product";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export const metadata: Metadata = {
  title: "Product Catalog | Clearup",
  description: "Browse products.",
};

export default async function ProductListPage({
  params,
  searchParams,
}: PageProps) {
  const { slug } = await params;
  const rawParams = await searchParams;
  const flatParams = flattenSearchParams(rawParams);
  const initialFilters = parseProductListFiltersFromSearchParams(
    flatParams,
    slug,
  );
  const initialSearch = flatParams.search ?? "";
  const page = parsePageParam(rawParams.page, PRODUCT_CATALOG_PAGE_SIZE);
  const resultParams = productListFiltersToSearchParams(initialFilters, initialSearch);
  if (page > 1) resultParams.set("page", String(page));
  const resultQuery = resultParams.toString();

  let productsPage: { products: Product[]; total: number } = {
    products: [],
    total: 0,
  };
  let catalogError: CatalogError | null = null;
  try {
    productsPage = await fetchProductsByCategory(
      slug,
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
    availableBrands = await fetchCategoryBrands(slug);
  } catch {
    // Product results remain useful if the optional facet request is unavailable.
  }

  const lastPage = Math.max(1, Math.ceil(productsPage.total / PRODUCT_CATALOG_PAGE_SIZE));
  if (!catalogError && page > lastPage) {
    if (lastPage > 1) resultParams.set("page", String(lastPage));
    else resultParams.delete("page");
    redirect(`/products/category/${slug}${resultParams.size ? `?${resultParams}` : ""}`);
  }

  const listKey = slug;

  return (
    <ProductListClient
      key={listKey}
      scope={{ type: "category", slug }}
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
