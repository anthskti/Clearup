"use client";

import type { ProductMerchantWithDetails } from "@/types/merchant";
import type { CatalogError } from "@/types/product";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5050";
const BATCH_SIZE = 40;
const CACHE_TTL_MS = 60_000;
const MAX_CACHED_PRODUCTS = 200;

type CachedOffers = { offers: ProductMerchantWithDetails[]; expiresAt: number };
type FetchOptions = { signal?: AbortSignal };
type FetchResult = {
  offers: Record<number, ProductMerchantWithDetails[]>;
  failedIds: number[];
  error: CatalogError | null;
};

const successfulOffers = new Map<number, CachedOffers>();
let cooldownUntil = 0;

function browserOnly(): void {
  if (typeof window === "undefined") {
    throw new Error("Catalog merchant offers can only be fetched in a browser");
  }
}

function throwIfAborted(signal?: AbortSignal): void {
  if (signal?.aborted) throw new DOMException("Aborted", "AbortError");
}

export function getCachedCatalogMerchantOffers(
  productId: number,
): ProductMerchantWithDetails[] | undefined {
  browserOnly();
  const cached = successfulOffers.get(productId);
  if (!cached || cached.expiresAt <= Date.now()) {
    successfulOffers.delete(productId);
    return undefined;
  }
  return cached.offers;
}

export function getCatalogMerchantRetryAt(): number | null {
  browserOnly();
  return cooldownUntil > Date.now() ? cooldownUntil : null;
}

function parseRetryAt(res: Response): number {
  const value = res.headers.get("retry-after") ?? res.headers.get("x-retry-after");
  if (value) {
    const seconds = Number(value);
    const parsed = Number.isFinite(seconds)
      ? Date.now() + Math.max(0, seconds) * 1000
      : Date.parse(value);
    if (Number.isFinite(parsed)) return Math.max(Date.now(), parsed);
  }
  return Date.now() + 1000;
}

function errorFromResponse(res: Response): CatalogError {
  let retryAt: number | null = null;
  if (res.status === 429) {
    cooldownUntil = Math.max(cooldownUntil, parseRetryAt(res));
    retryAt = cooldownUntil;
  }
  return {
    status: res.status,
    requestId: res.headers.get("x-request-id"),
    retryAt,
  };
}

function isOffer(value: unknown): value is ProductMerchantWithDetails {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const offer = value as Record<string, unknown>;
  if (
    !Number.isSafeInteger(offer.id) ||
    !Number.isSafeInteger(offer.productId) ||
    !Number.isSafeInteger(offer.merchantId) ||
    typeof offer.website !== "string" ||
    !(offer.price === null || (typeof offer.price === "number" && Number.isFinite(offer.price)))
  ) return false;
  if (offer.merchant !== undefined) {
    const merchant = offer.merchant;
    if (!merchant || typeof merchant !== "object" || Array.isArray(merchant)) return false;
    const details = merchant as Record<string, unknown>;
    if (
      (details.id !== undefined && !Number.isSafeInteger(details.id)) ||
      (details.name !== undefined && typeof details.name !== "string") ||
      (details.logo != null && typeof details.logo !== "string")
    ) return false;
  }
  return true;
}

function storeOffers(id: number, offers: ProductMerchantWithDetails[]): void {
  successfulOffers.delete(id);
  successfulOffers.set(id, { offers, expiresAt: Date.now() + CACHE_TTL_MS });
  while (successfulOffers.size > MAX_CACHED_PRODUCTS) {
    const oldest = successfulOffers.keys().next().value;
    if (oldest === undefined) break;
    successfulOffers.delete(oldest);
  }
}

export async function getCatalogMerchantOffersByProductIds(
  productIds: number[],
  options?: FetchOptions,
): Promise<FetchResult> {
  browserOnly();
  const signal = options?.signal;
  throwIfAborted(signal);

  const ids = [...new Set(productIds.filter(
    (id) => Number.isSafeInteger(id) && id > 0,
  ))].sort((a, b) => a - b);
  const offers: Record<number, ProductMerchantWithDetails[]> = {};
  const unresolved: number[] = [];
  for (const id of ids) {
    const cached = getCachedCatalogMerchantOffers(id);
    if (cached !== undefined) offers[id] = cached;
    else unresolved.push(id);
  }

  let error: CatalogError | null = null;
  for (let start = 0; start < unresolved.length; start += BATCH_SIZE) {
    const batch = unresolved.slice(start, start + BATCH_SIZE);
    throwIfAborted(signal);
    const retryAt = getCatalogMerchantRetryAt();
    if (retryAt !== null) {
      // Return the cooldown to the UI instead of queuing a burst of delayed requests.
      error = { status: 429, requestId: null, retryAt };
      break;
    }
    let res: Response;
    try {
      res = await fetch(
        `${API_URL}/api/products/merchants/batch?ids=${encodeURIComponent(batch.join(","))}`,
        { cache: "no-store", signal },
      );
    } catch {
      if (signal?.aborted) throw new DOMException("Aborted", "AbortError");
      error = { status: null, requestId: null, retryAt: null };
      break;
    }
    throwIfAborted(signal);
    if (!res.ok) {
      error = errorFromResponse(res);
      break;
    }

    let data: unknown;
    try {
      data = await res.json();
    } catch {
      throwIfAborted(signal);
      error = { status: null, requestId: res.headers.get("x-request-id"), retryAt: null };
      break;
    }
    throwIfAborted(signal);
    if (!data || typeof data !== "object" || Array.isArray(data)) {
      error = { status: null, requestId: res.headers.get("x-request-id"), retryAt: null };
      break;
    }

    const record = data as Record<string, unknown>;
    const validated: Array<[number, ProductMerchantWithDetails[]]> = [];
    let malformed = false;
    for (const id of batch) {
      const value = record[String(id)];
      if (!Array.isArray(value) || !value.every(isOffer) || value.some((offer) => offer.productId !== id)) {
        malformed = true;
        continue;
      }
      validated.push([id, value]);
    }
    throwIfAborted(signal);
    for (const [id, productOffers] of validated) {
      offers[id] = productOffers;
      storeOffers(id, productOffers);
    }
    if (malformed) {
      error = { status: null, requestId: res.headers.get("x-request-id"), retryAt: null };
      break;
    }
  }

  const failedIds = unresolved.filter((id) => offers[id] === undefined);
  return { offers, failedIds, error };
}
