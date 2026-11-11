import type { Product, ProductListFilters, ProductCatalogFetchOptions, ProductCatalogPage, CsvImportResponse, CatalogError } from "@/types/product";
import { ProductMerchantWithDetails } from "@/types/merchant";
import { appendProductListFiltersToQuery, productListFiltersNeedDynamicFetch } from "@/lib/productListFilters";
import { PRODUCT_PRICE_SLIDER_MAX } from "@/constants/productFilters";
import { parseSkinTypeTagsFromParam } from "@/lib/routineSkinTypeTags";
import { mutationHeaders } from "@/lib/mutationHeaders";
import type { ImportIssue, ImportPage, ImportRun } from "@/types/import";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5050";

export class ProductCatalogRequestError extends Error {
  constructor(public readonly catalogError: CatalogError) {
    super("Catalog request failed");
  }
}

function parseProductCatalogResponse(data: unknown): ProductCatalogPage {
  const malformedError = () =>
    new ProductCatalogRequestError({
      status: null,
      requestId: null,
      retryAt: null,
    });
  const productsAreValid = (products: unknown[]) =>
    products.every(
      (product) =>
        product &&
        typeof product === "object" &&
        Number.isFinite((product as { id?: unknown }).id) &&
        typeof (product as { name?: unknown }).name === "string",
    );

  if (Array.isArray(data)) {
    if (!productsAreValid(data)) throw malformedError();
    return { products: data, total: data.length };
  }
  if (data && typeof data === "object" && "products" in data) {
    const payload = data as { products?: unknown; total?: unknown };
    if (!Array.isArray(payload.products)) throw malformedError();
    const products = payload.products;
    if (!productsAreValid(products)) throw malformedError();
    if (
      typeof payload.total !== "number" ||
      !Number.isSafeInteger(payload.total) ||
      payload.total < 0
    ) {
      throw malformedError();
    }
    const total = payload.total;
    return { products, total };
  }
  throw malformedError();
}

function catalogError(res: Response): CatalogError {
  const retry = res.headers.get("retry-after");
  let retryAt: number | null = null;
  if (retry) {
    const seconds = Number(retry);
    const parsed = Number.isFinite(seconds)
      ? Date.now() + Math.max(0, seconds) * 1000
      : Date.parse(retry);
    retryAt = Number.isFinite(parsed) ? parsed : null;
  }
  return {
    status: res.status,
    requestId: res.headers.get("x-request-id"),
    retryAt,
  };
}

// Category lists (server Data Cache). PDP product body uses no-store.
export const CATALOG_REVALIDATE_SEC = 3600; // 1h

/** Per-product merchant offers on PDP (server Data Cache). */
export const PRODUCT_MERCHANTS_REVALIDATE_SEC = 1800; // 30m

/** Batched offers on routine pages (server Data Cache). */
export const BATCH_MERCHANT_OFFERS_REVALIDATE_SEC = 21600; // 6h

/** @deprecated Use BATCH_MERCHANT_OFFERS_REVALIDATE_SEC */
export const MERCHANT_OFFERS_REVALIDATE_SEC =
  BATCH_MERCHANT_OFFERS_REVALIDATE_SEC;

// Same rule as builder: lowest product_merchant.price gets shown.
type PricedMerchantOffer = ProductMerchantWithDetails & { price: number };

export function pickLowestPriceOffer(
  offers: ProductMerchantWithDetails[],
): PricedMerchantOffer | null {
  const pricedOffers = (offers ?? []).filter(
    (offer): offer is PricedMerchantOffer =>
      typeof offer.price === "number" && Number.isFinite(offer.price),
  );
  if (!pricedOffers.length) return null;
  return pricedOffers.sort((a, b) => a.price - b.price)[0];
}

// One request returns current offers per product id without serving cached prices.
export async function getMerchantOffersByProductIds(
  productIds: number[],
): Promise<Record<number, ProductMerchantWithDetails[]>> {
  const unique = [
    ...new Set(productIds.filter((id) => Number.isFinite(id) && id > 0)),
  ];
  if (!unique.length) return {};

  const sortedIds = unique.sort((a, b) => a - b);
  const out: Record<number, ProductMerchantWithDetails[]> = Object.fromEntries(
    sortedIds.map((id) => [id, []]),
  );
  const batchSize = 40;

  for (let start = 0; start < sortedIds.length; start += batchSize) {
    const batch = sortedIds.slice(start, start + batchSize);
    const qs = batch.join(",");
    const res = await fetch(
      `${API_URL}/api/products/merchants/batch?ids=${encodeURIComponent(qs)}`,
      { cache: "no-store" },
    );
    if (!res.ok) {
      console.error(
        `getMerchantOffersByProductIds: batch request failed (${res.status})`,
      );
      continue;
    }

    const json = (await res.json()) as Record<
      string,
      ProductMerchantWithDetails[]
    >;
    for (const id of batch) {
      out[id] = json[String(id)] ?? [];
    }
  }
  return out;
}

export const getAllProducts = async (
  limit: number = 25,
  offset: number = 0,
  options?: ProductCatalogFetchOptions,
): Promise<Product[]> => {
  const page = await fetchProducts(limit, offset, options);
  return page.products;
};

// Unified full-catalog fetch — search + skin type / brand filters. 
export async function fetchProducts(
  limit: number = 25,
  offset: number = 0,
  options?: ProductCatalogFetchOptions,
): Promise<ProductCatalogPage> {
  const qs = new URLSearchParams({
    limit: String(limit),
    offset: String(offset),
  });
  if (options?.search?.trim()) {
    qs.set("search", options.search.trim());
  }
  appendProductListFiltersToQuery(qs, options?.filters);

  const hasFilters = productListFiltersNeedDynamicFetch(
    options?.filters,
    options?.search,
  );

  const res = await fetch(`${API_URL}/api/products?${qs.toString()}`, {
    ...(hasFilters
      ? { cache: "no-store" as const }
      : { next: { revalidate: CATALOG_REVALIDATE_SEC } }),
  });

  if (!res.ok) {
    const metadata = catalogError(res);
    console.error("fetchProducts failed", { status: metadata.status, requestId: metadata.requestId, retryAt: metadata.retryAt });
    throw new ProductCatalogRequestError(metadata);
  }
  const data = await res.json();
  return parseProductCatalogResponse(data);
}

export async function fetchAllBrands(): Promise<string[]> {
  const res = await fetch(`${API_URL}/api/products/brands`, {
    next: { revalidate: CATALOG_REVALIDATE_SEC },
  });
  if (!res.ok) {
    console.error("fetchAllBrands failed");
    return [];
  }
  const data = await res.json();
  return Array.isArray(data) ? data.filter(Boolean) : [];
}

export const getProductsByCategory = async (
  category: string,
  limit: number = 25,
  offset: number = 0,
  options?: { skinType?: string; search?: string },
): Promise<Product[]> => {
  const skinTypes = parseSkinTypeTagsFromParam(options?.skinType);
  const filters: ProductListFilters | undefined =
    skinTypes.length > 0
      ? {
          skinTypes,
          brands: [],
          attributes: {},
          minPrice: 0,
          maxPrice: PRODUCT_PRICE_SLIDER_MAX,
        }
      : undefined;

  const page = await fetchProductsByCategory(category, limit, offset, {
    search: options?.search,
    filters,
  });
  return page.products;
};

// Unified category catalog fetch — search + sidebar filters. 
export async function fetchProductsByCategory(
  category: string,
  limit: number = 25,
  offset: number = 0,
  options?: ProductCatalogFetchOptions,
): Promise<ProductCatalogPage> {
  const qs = new URLSearchParams({
    limit: String(limit),
    offset: String(offset),
  });
  if (options?.search?.trim()) {
    qs.set("search", options.search.trim());
  }
  appendProductListFiltersToQuery(qs, options?.filters);

  const hasFilters = productListFiltersNeedDynamicFetch(
    options?.filters,
    options?.search,
  );

  const res = await fetch(
    `${API_URL}/api/products/category/${category}?${qs.toString()}`,
    hasFilters ? { cache: "no-store" } : { next: { revalidate: CATALOG_REVALIDATE_SEC } },
  );

  if (!res.ok) {
    const metadata = catalogError(res);
    console.error("fetchProductsByCategory failed", { status: metadata.status, requestId: metadata.requestId, retryAt: metadata.retryAt });
    throw new ProductCatalogRequestError(metadata);
  }
  const data = await res.json();
  return parseProductCatalogResponse(data);
}

export async function fetchCategoryBrands(category: string): Promise<string[]> {
  const res = await fetch(
    `${API_URL}/api/products/category/${category}/brands`,
    { next: { revalidate: CATALOG_REVALIDATE_SEC } },
  );
  if (!res.ok) {
    console.error(`fetchCategoryBrands failed: ${category}`);
    return [];
  }
  const data = await res.json();
  return Array.isArray(data) ? data.filter(Boolean) : [];
}

export const searchProducts = async (
  query: string,
  limit: number = 25,
  offset: number = 0,
  filters?: ProductListFilters,
): Promise<Product[]> => {
  const page = await fetchProducts(limit, offset, { search: query, filters });
  return page.products;
};

export const searchProductsByCategory = async (
  category: string,
  query: string,
  limit: number = 25,
  offset: number = 0,
  filters?: ProductListFilters,
): Promise<Product[]> => {
  const page = await fetchProductsByCategory(category, limit, offset, {
    search: query,
    filters,
  });
  return page.products;
};

export const getProductById = async (id: string): Promise<Product> => {
  const res = await fetch(`${API_URL}/api/products/id/${id}`, {
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch product ${id}`);
  }
  return res.json();
};

export const getMerchantsByProductId = async (
  productId: string,
): Promise<ProductMerchantWithDetails[]> => {
  const res = await fetch(`${API_URL}/api/products/id/${productId}/merchants`, {
    next: { revalidate: PRODUCT_MERCHANTS_REVALIDATE_SEC },
  });
  if (!res.ok) {
    console.error(`Failed to fetch merchants for product: ${productId}`);
    return [];
  }
  return res.json();
};

export const addMerchantByProductId = async (
  id: number,
  merchantData: {
    merchantId: number;
    website: string;
    price: number;
    stock: boolean;
    shipping: string;
  },
): Promise<Product> => {
  const res = await fetch(`${API_URL}/api/products/id/${id}/merchants`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(merchantData),
  });
  if (!res.ok) {
    const errorData = await res
      .json()
      .catch(() => ({ error: `Failed to add merchant to product ${id}` }));
    throw new Error(
      errorData.error || `Failed to add merchant to product ${id}`,
    );
  }
  return res.json();
};

export class CsvImportError extends Error {
  constructor(message: string, readonly importId?: number) {
    super(message);
    this.name = "CsvImportError";
  }
}

async function readImportError(res: Response): Promise<CsvImportError> {
  const fallback = `Import failed (HTTP ${res.status})`;
  try {
    const data = (await res.json()) as { error?: string; message?: string; importId?: number };
    if (res.status === 413) {
      return new CsvImportError(
        data.error ||
        "CSV file is too large for the server limit. Try a smaller batch.",
        data.importId,
      );
    }
    return new CsvImportError(data.error || data.message || fallback, data.importId);
  } catch {
    if (res.status === 413) {
      return new CsvImportError("CSV payload too large (HTTP 413). Try importing in smaller batches.");
    }
    return new CsvImportError(fallback);
  }
}

async function postCsvImport(
  path: string,
  csvOrFile: string | File,
): Promise<Response> {
  const init: RequestInit = {
    method: "POST",
    credentials: "include",
    cache: "no-store",
    body: csvOrFile,
    headers: mutationHeaders({
      "Content-Type": "text/csv; charset=utf-8",
      "x-import-filename": encodeURIComponent(typeof csvOrFile === "string" ? "pasted.csv" : csvOrFile.name),
    }),
  };
  return fetch(`${API_URL}${path}`, init);
}

/** Import via raw CSV body (paste or File) — avoids JSON size overhead/limit. */
export const importProductsCsv = async (
  csvOrFile: string | File,
): Promise<CsvImportResponse> => {
  const res = await postCsvImport("/api/products/admin/import/csv", csvOrFile);
  if (!res.ok) {
    throw await readImportError(res);
  }
  return res.json();
};

export const importMerchantOffersCsv = async (
  csvOrFile: string | File,
): Promise<CsvImportResponse> => {
  const res = await postCsvImport("/api/products/admin/import/offers", csvOrFile);
  if (!res.ok) {
    throw await readImportError(res);
  }
  return res.json();
};

export const importPriceUpdatesCsv = async (
  csvOrFile: string | File,
): Promise<CsvImportResponse> => {
  const res = await postCsvImport(
    "/api/products/admin/import/prices",
    csvOrFile,
  );
  if (!res.ok) {
    throw await readImportError(res);
  }
  return res.json();
};

async function fetchImportJson<T>(path: string): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, { cache: "no-store", credentials: "include" });
  if (!res.ok) throw new Error(`Import report request failed (HTTP ${res.status})`);
  return res.json();
}

export function getImportHistory(limit = 10, offset = 0): Promise<ImportPage<ImportRun>> {
  return fetchImportJson(`/api/products/admin/imports?limit=${limit}&offset=${offset}`);
}

export function getImportRun(importId: number): Promise<ImportRun> {
  return fetchImportJson(`/api/products/admin/imports/${importId}`);
}

export function getImportIssues(importId: number, limit = 25, offset = 0): Promise<ImportPage<ImportIssue>> {
  return fetchImportJson(`/api/products/admin/imports/${importId}/issues?limit=${limit}&offset=${offset}`);
}

export async function downloadImportReport(importId: number): Promise<void> {
  const res = await fetch(`${API_URL}/api/products/admin/imports/${importId}/report`, {
    cache: "no-store",
    credentials: "include",
  });
  if (!res.ok) throw new Error(`Report download failed (HTTP ${res.status})`);
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `import-${importId}-report.json`;
  link.click();
  URL.revokeObjectURL(url);
}
