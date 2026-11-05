export interface CatalogRateLimitConfig {
  capacity: number;
  refillPerSecond: number;
}

/** Read at app startup, after the existing environment bootstrap has run. */
export function readCatalogRateLimitConfig(
  env: NodeJS.ProcessEnv = process.env,
): CatalogRateLimitConfig {
  const capacity = Number(env.CATALOG_BUCKET_CAPACITY ?? 20);
  const refillPerSecond = Number(env.CATALOG_BUCKET_REFILL_PER_SECOND ?? 2);

  if (!Number.isSafeInteger(capacity) || capacity < 1) {
    throw new Error("CATALOG_BUCKET_CAPACITY must be a positive safe integer");
  }
  if (
    !Number.isFinite(refillPerSecond) || refillPerSecond <= 0 ||
    !Number.isFinite((capacity / refillPerSecond) * 1000)
  ) {
    throw new Error("CATALOG_BUCKET_REFILL_PER_SECOND must be a finite positive refill rate");
  }
  return { capacity, refillPerSecond };
}
