import { fetchAllBrands, fetchProducts } from "@/lib/products";
import ProductListClient from "@/components/products/ProductListClient";
import { Metadata } from "next";
import {
  flattenSearchParams,
  parseGlobalProductListFiltersFromSearchParams,
} from "@/lib/productListFilters";

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

  const [productsPage, availableBrands] = await Promise.all([
    fetchProducts(20, 0, {
      search: initialSearch || undefined,
      filters: initialFilters,
    }),
    fetchAllBrands(),
  ]);

  const listKey = new URLSearchParams(
    Object.entries(flatParams).filter(
      (entry): entry is [string, string] => entry[1] !== undefined,
    ),
  ).toString();

  return (
    <ProductListClient
      key={listKey}
      scope={{ type: "all" }}
      initialProducts={productsPage.products}
      initialTotal={productsPage.total}
      initialFilters={initialFilters}
      initialSearch={initialSearch}
      availableBrands={availableBrands}
    />
  );
}
