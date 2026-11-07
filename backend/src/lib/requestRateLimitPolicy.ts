import type { Request } from "express";
import type { TokenBucketPolicyName } from "../config/rateLimitPolicies";

type StaticAuthRoutes = Partial<Record<TokenBucketPolicyName, readonly string[]>>;
type DynamicAuthRoute = { method: string; path: RegExp; policy: TokenBucketPolicyName };

// Add installed Better Auth routes here, grouped by HTTP method and policy.
// These rules use exact case-sensitive paths from Better Auth 1.4.19.
const AUTH_ROUTES: Record<string, StaticAuthRoutes> = {
  GET: {
    sessionReads: ["get-session", "list-sessions", "list-accounts", "me"],
    otherAuth: ["account-info", "admin/get-user", "admin/list-users"],
    recovery: ["verify-email"],
  },
  POST: {
    sessionReads: ["get-session"],
    login: ["sign-in/email"],
    recovery: ["sign-up/email", "request-password-reset", "reset-password", "send-verification-email"],
    otherAuth: [
      "sign-in/social", "sign-out", "revoke-session", "revoke-sessions", "revoke-other-sessions",
      "update-user", "update-session", "change-email", "change-password", "delete-user", "link-social",
      "unlink-account", "get-access-token", "refresh-token", "verify-password",
      "admin/create-user", "admin/update-user", "admin/set-role", "admin/set-user-password",
      "admin/ban-user", "admin/unban-user", "admin/remove-user", "admin/impersonate-user",
      "admin/stop-impersonating", "admin/has-permission", "admin/list-user-sessions",
      "admin/revoke-user-session", "admin/revoke-user-sessions",
    ],
  },
};
const POLICY_NAMES: readonly TokenBucketPolicyName[] = ["catalog", "sessionReads", "login", "recovery", "otherAuth"];

const DYNAMIC_AUTH_ROUTES: DynamicAuthRoute[] = [
  { method: "GET", path: /^reset-password\/[^/]+$/, policy: "recovery" },
  { method: "GET", path: /^callback\/[^/]+$/, policy: "otherAuth" },
  { method: "POST", path: /^callback\/[^/]+$/, policy: "otherAuth" },
  { method: "GET", path: /^delete-user\/callback$/, policy: "otherAuth" },
];

const CATALOG_ROUTES = [
  /^\/api\/products\/?$/i,
  /^\/api\/products\/brands\/?$/i,
  /^\/api\/products\/merchants\/batch\/?$/i,
  /^\/api\/products\/category\/[^/]+\/?$/i,
  /^\/api\/products\/category\/[^/]+\/brands\/?$/i,
  /^\/api\/products\/id\/[^/]+\/?$/i,
  /^\/api\/products\/id\/[^/]+\/merchants\/?$/i,
  /^\/api\/merchant\/?$/i,
];

export type RequestRateLimitClassification = { policy: TokenBucketPolicyName; known: boolean } | null;
const isAuthPath = (path: string) => path === "/api/auth" || path.startsWith("/api/auth/");

/** Shared classifier for policy dispatch and global exemptions. */
export function classifyRequestRateLimit(req: Pick<Request, "method" | "path">): RequestRateLimitClassification {
  const method = req.method.toUpperCase() === "HEAD" ? "GET" : req.method.toUpperCase();
  if ((method === "GET" || method === "HEAD") && CATALOG_ROUTES.some((path) => path.test(req.path))) {
    return { policy: "catalog", known: true };
  }
  if (!isAuthPath(req.path)) return null;

  const endpoint = req.path.replace(/^\/api\/auth\/?/, "").replace(/\/$/, "");
  const entries = AUTH_ROUTES[method] ?? {};
  for (const policy of POLICY_NAMES) {
    if (entries[policy]?.includes(endpoint)) return { policy, known: true };
  }
  const dynamic = DYNAMIC_AUTH_ROUTES.find((route) => route.method === method && route.path.test(endpoint));
  return dynamic ? { policy: dynamic.policy, known: true } : { policy: "otherAuth", known: false };
}

export function isKnownRateLimitedRequest(req: Pick<Request, "method" | "path">): boolean {
  return classifyRequestRateLimit(req)?.known ?? false;
}
