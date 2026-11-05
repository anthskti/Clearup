import rateLimit, { ipKeyGenerator } from "express-rate-limit";
import type { Request, RequestHandler } from "express";
import logger from "../lib/logger";
import { TokenBucket } from "../lib/tokenBucket";
import { RATE_LIMIT_POLICIES, type TokenBucketPolicyName } from "../config/rateLimitPolicies";
import { classifyRequestRateLimit, isKnownRateLimitedRequest } from "../lib/requestRateLimitPolicy";

/** Headers browser clients need to inspect throttling and correlate responses. */
export const RATE_LIMIT_EXPOSED_HEADERS = [
  "Retry-After",
  "X-Retry-After",
  "RateLimit-Limit",
  "RateLimit-Remaining",
  "RateLimit-Reset",
  "RateLimit-Policy",
  "RateLimit",
  "X-Request-ID",
];

const bucketStores: Record<TokenBucketPolicyName, TokenBucket> = {
  catalog: new TokenBucket(RATE_LIMIT_POLICIES.tokenBuckets.catalog),
  sessionReads: new TokenBucket(RATE_LIMIT_POLICIES.tokenBuckets.sessionReads),
  login: new TokenBucket(RATE_LIMIT_POLICIES.tokenBuckets.login),
  recovery: new TokenBucket(RATE_LIMIT_POLICIES.tokenBuckets.recovery),
  otherAuth: new TokenBucket(RATE_LIMIT_POLICIES.tokenBuckets.otherAuth),
};

/** One classified request budget; unknown auth paths also use the bounded fallback store. */
export const requestPolicyLimiter: RequestHandler = (req, res, next) => {
  const classification = classifyRequestRateLimit(req);
  if (!classification) return next();
  const { policy } = classification;
  // req.ip uses Express's verified proxy chain; normalize IPv6 identities to /56.
  const result = bucketStores[policy].consume(ipKeyGenerator(req.ip || "unknown"));
  if (result.allowed) return next();

  const requestLogger = req.log ?? logger;
  requestLogger.warn(
    {
      event: "rate_limit.exceeded",
      limiter: policy,
      policy,
      identity: "ip",
      method: req.method,
      reason: result.reason,
    },
    "Rate limit exceeded",
  );
  res.setHeader("Retry-After", result.retryAfterSeconds);
  res.setHeader("X-Retry-After", result.retryAfterSeconds);
  res.setHeader("Cache-Control", "no-store");
  if (req.path === "/api/auth" || req.path.startsWith("/api/auth/")) {
    return res.status(429).json({
      code: "TOO_MANY_REQUESTS",
      message: "Too many requests. Please try again later.",
    });
  }
  return res.status(429).send("Too many catalog requests. Please try again later.");
};

export const globalLimiter = rateLimit({
  windowMs: RATE_LIMIT_POLICIES.fixedWindows.global.windowMs,
  max: RATE_LIMIT_POLICIES.fixedWindows.global.max,
  standardHeaders: true,
  legacyHeaders: false,
  message: "Too many requests from this IP, please try again later.",
  skip: (req) => isKnownRateLimitedRequest(req),
  handler: (req, res, _next, options) => {
    const requestLogger = (req as Request & { log?: typeof logger }).log ?? logger;
    requestLogger.warn(
      { event: "rate_limit.exceeded", limiter: "global", method: req.method },
      "Rate limit exceeded",
    );
    res.status(options.statusCode).send(options.message);
  },
});
