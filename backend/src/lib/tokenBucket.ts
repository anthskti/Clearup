import { performance } from "node:perf_hooks";

interface Bucket {
  tokens: number;
  updatedAt: number;
}

interface TokenBucketOptions {
  capacity: number;
  refillPerSecond: number;
  maxBuckets?: number;
  now?: () => number;
}

type TokenBucketResult =
  | { allowed: true }
  | { allowed: false; retryAfterSeconds: number; reason: "empty" | "storage_full" };

const CLEANUP_INTERVAL_MS = 30_000;
const IDLE_TTL_MS = 60_000;

/** Process-local buckets. No timers: incoming traffic periodically cleans idle entries. */
export class TokenBucket {
  private readonly buckets = new Map<string, Bucket>();
  private readonly capacity: number;
  private readonly refillPerMs: number;
  private readonly maxBuckets: number;
  private readonly now: () => number;
  private nextCleanupAt = 0;

  constructor({
    capacity,
    refillPerSecond,
    maxBuckets = 10_000,
    now = () => performance.now(),
  }: TokenBucketOptions) {
    if (
      !Number.isSafeInteger(capacity) || capacity < 1 ||
      !Number.isFinite(refillPerSecond) || refillPerSecond <= 0 ||
      !Number.isFinite((capacity / refillPerSecond) * 1000) ||
      !Number.isSafeInteger(maxBuckets) || maxBuckets < 1
    ) {
      throw new Error("Invalid token bucket configuration");
    }
    this.capacity = capacity;
    this.refillPerMs = refillPerSecond / 1000;
    this.maxBuckets = maxBuckets;
    this.now = now;
  }

  consume(key: string): TokenBucketResult {
    const now = this.now();
    if (now >= this.nextCleanupAt) this.cleanup(now);

    let bucket = this.buckets.get(key);
    if (!bucket) {
      if (this.buckets.size >= this.maxBuckets) {
        // Never evict depleted buckets: cycling IPs must not reset their budgets.
        return this.reject(this.nextCleanupAt - now, "storage_full");
      }
      bucket = { tokens: this.capacity, updatedAt: now };
      this.buckets.set(key, bucket);
    }

    const elapsed = Math.max(0, now - bucket.updatedAt);
    bucket.tokens = Math.min(this.capacity, bucket.tokens + elapsed * this.refillPerMs);
    bucket.updatedAt = now;
    if (bucket.tokens < 1) {
      return this.reject((1 - bucket.tokens) / this.refillPerMs, "empty");
    }
    bucket.tokens -= 1;
    return { allowed: true };
  }

  private reject(waitMs: number, reason: "empty" | "storage_full"): TokenBucketResult {
    return {
      allowed: false,
      retryAfterSeconds: Math.max(1, Math.ceil(waitMs / 1000)),
      reason,
    };
  }

  private cleanup(now: number): void {
    for (const [key, bucket] of this.buckets) {
      const idleMs = now - bucket.updatedAt;
      // Only discard idle entries whose balances would already be fully replenished.
      if (idleMs >= IDLE_TTL_MS && bucket.tokens + idleMs * this.refillPerMs >= this.capacity) {
        this.buckets.delete(key);
      }
    }
    this.nextCleanupAt = now + CLEANUP_INTERVAL_MS;
  }
}
