/** Process-local budgets. The five IP-keyed token stores may hold at most 10,000 buckets total. */
export const RATE_LIMIT_POLICIES = {
  tokenBuckets: {
    catalog: { capacity: 20, refillPerSecond: 2, maxBuckets: 2_000 },
    sessionReads: { capacity: 30, refillPerSecond: 1, maxBuckets: 2_000 },
    login: { capacity: 5, refillPerSecond: 1 / 100, maxBuckets: 2_000 },
    recovery: { capacity: 5, refillPerSecond: 1 / 60, maxBuckets: 2_000 },
    otherAuth: { capacity: 20, refillPerSecond: 1, maxBuckets: 2_000 },
  },
  fixedWindows: {
    global: { max: 300, windowMs: 900_000 },
    routineCreate: { max: 10, windowMs: 3_600_000 },
    routineMutation: { max: 60, windowMs: 900_000 },
  },
} as const;

const tokenBucketCapacity = Object.values(RATE_LIMIT_POLICIES.tokenBuckets)
  .reduce((total, { maxBuckets }) => total + maxBuckets, 0);
if (tokenBucketCapacity > 10_000) {
  throw new Error("Rate limit token bucket stores may hold at most 10,000 buckets total");
}

export type TokenBucketPolicyName = keyof typeof RATE_LIMIT_POLICIES.tokenBuckets;
