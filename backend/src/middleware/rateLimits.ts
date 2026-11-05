import rateLimit from "express-rate-limit";
import type { Request } from "express";
import logger from "../lib/logger";

/** Headers browser clients need to inspect throttling and correlate responses. */
export const RATE_LIMIT_EXPOSED_HEADERS = [
  "Retry-After",
  "RateLimit-Limit",
  "RateLimit-Remaining",
  "RateLimit-Reset",
  "RateLimit-Policy",
  "RateLimit",
  "X-Request-ID",
];

const PUBLIC_CATALOG_READ_PATHS = [
  /^\/api\/products\/?$/i,
  /^\/api\/products\/brands\/?$/i,
  /^\/api\/products\/merchants\/batch\/?$/i,
  /^\/api\/products\/category\/[^/]+\/?$/i,
  /^\/api\/products\/category\/[^/]+\/brands\/?$/i,
  /^\/api\/products\/id\/[^/]+\/?$/i,
  /^\/api\/products\/id\/[^/]+\/merchants\/?$/i,
];

/** True only for the explicitly public catalog GET/HEAD route shapes. */
export function isPublicCatalogRead(req: Pick<Request, "method" | "path">): boolean {
  if (req.method !== "GET" && req.method !== "HEAD") return false;
  return PUBLIC_CATALOG_READ_PATHS.some((route) => route.test(req.path));
}

export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: "Too many requests from this IP, please try again later.",
  skip: isPublicCatalogRead,
  handler: (req, res, _next, options) => {
    const requestLogger = (req as Request & { log?: typeof logger }).log ?? logger;
    requestLogger.warn(
      { event: "rate_limit.exceeded", limiter: "global", method: req.method },
      "Rate limit exceeded",
    );
    res.status(options.statusCode).send(options.message);
  },
});
