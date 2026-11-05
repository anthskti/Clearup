"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  catalogIdentity,
  canonicalQuery,
  normalizeQuery,
  queriesEqual,
  type CatalogScope,
} from "@/lib/productCatalogUrl";

const FILTER_DEBOUNCE_MS = 250;

interface UseCatalogUrlNavigationOptions {
  basePath: string;
  pathname: string;
  committedQuery: string;
  scopeType: CatalogScope["type"];
  scopeSlug: string;
  /** Snapshot draft versions when a programmatic navigation starts. */
  onBeginNavigation: () => void;
  /** Bump + snapshot draft versions on browser back/forward. */
  onBrowserHistoryChange: () => void;
}

/**
 * Owns pending URL navigation for the product catalog: debounce, push/replace,
 * popstate, and whether SSR props are safe to accept.
 */
export function useCatalogUrlNavigation({
  basePath,
  pathname,
  committedQuery,
  scopeType,
  scopeSlug,
  onBeginNavigation,
  onBrowserHistoryChange,
}: UseCatalogUrlNavigationOptions) {
  const router = useRouter();
  const [isNavigating, setIsNavigating] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const queuedQuery = useRef<string | null>(null);
  const hasPendingNavigation = useRef(false);
  const navigationFromQuery = useRef("");
  /** Latest intended destination query (canonical). Null when settled. */
  const pendingDestinationQuery = useRef<string | null>(null);
  /** Last query actually issued to the router (or still queued for debounce). */
  const issuedDestinationQuery = useRef<string | null>(null);

  const cancelScheduled = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  }, []);

  const markSettled = useCallback(() => {
    hasPendingNavigation.current = false;
    pendingDestinationQuery.current = null;
    issuedDestinationQuery.current = null;
    setIsNavigating(false);
  }, []);

  const shouldAcceptServerResult = useCallback(
    (resultIdentity: string, committedIdentity: string) => {
      if (resultIdentity !== committedIdentity) return false;
      if (queuedQuery.current !== null) return false;
      if (
        pendingDestinationQuery.current !== null &&
        !queriesEqual(committedQuery, pendingDestinationQuery.current)
      ) {
        return false;
      }
      if (
        hasPendingNavigation.current &&
        committedIdentity === navigationFromQuery.current
      ) {
        return false;
      }
      return true;
    },
    [committedQuery],
  );

  const issueRoute = useCallback(
    (query: string, replace: boolean) => {
      const url = `${basePath}${query ? `?${query}` : ""}`;
      issuedDestinationQuery.current = canonicalQuery(query);
      if (replace) router.replace(url, { scroll: false });
      else router.push(url, { scroll: false });
    },
    [basePath, router],
  );

  const beginRouteChange = useCallback(
    (
      query: string,
      options: { replace: boolean; debounceMs?: number },
    ) => {
      cancelScheduled();

      const desired = canonicalQuery(query);
      pendingDestinationQuery.current = desired;

      const desiredEqualsCommitted = queriesEqual(desired, committedQuery);
      const outstandingDifferentDestination =
        (queuedQuery.current !== null &&
          !queriesEqual(queuedQuery.current, desired)) ||
        (issuedDestinationQuery.current !== null &&
          !queriesEqual(issuedDestinationQuery.current, desired));

      if (options.debounceMs != null && !desiredEqualsCommitted) {
        queuedQuery.current = query;
      } else {
        queuedQuery.current = null;
      }

      navigationFromQuery.current = catalogIdentity(pathname, committedQuery);
      onBeginNavigation();

      // Already on the desired URL and nothing in flight to undo — done.
      if (desiredEqualsCommitted && !outstandingDifferentDestination) {
        pendingDestinationQuery.current = null;
        hasPendingNavigation.current = false;
        issuedDestinationQuery.current = null;
        setIsNavigating(false);
        return;
      }

      // Desired equals committed but a different destination was issued/queued:
      // supersede immediately so the in-flight filter nav cannot win.
      hasPendingNavigation.current = true;
      setIsNavigating(true);

      if (desiredEqualsCommitted && outstandingDifferentDestination) {
        issueRoute(query, true);
        return;
      }

      if (options.debounceMs != null) {
        timer.current = setTimeout(() => {
          timer.current = null;
          queuedQuery.current = null;
          hasPendingNavigation.current = true;
          issueRoute(query, true);
        }, options.debounceMs);
        return;
      }

      issueRoute(query, options.replace);
    },
    [
      cancelScheduled,
      committedQuery,
      issueRoute,
      onBeginNavigation,
      pathname,
    ],
  );

  const navigateNow = useCallback(
    (query: string, replace = false) => {
      beginRouteChange(query, { replace });
    },
    [beginRouteChange],
  );

  const scheduleReplace = useCallback(
    (query: string) => {
      beginRouteChange(query, { replace: true, debounceMs: FILTER_DEBOUNCE_MS });
    },
    [beginRouteChange],
  );

  useEffect(() => {
    const onPopState = () => {
      cancelScheduled();
      queuedQuery.current = null;
      onBrowserHistoryChange();
      const nextQuery = normalizeQuery(
        new URLSearchParams(window.location.search),
        scopeType,
        scopeSlug,
      );
      const nextIdentity = catalogIdentity(window.location.pathname, nextQuery);
      const committedIdentity = catalogIdentity(pathname, committedQuery);
      navigationFromQuery.current = committedIdentity;
      pendingDestinationQuery.current = canonicalQuery(nextQuery);
      issuedDestinationQuery.current = canonicalQuery(nextQuery);
      hasPendingNavigation.current = nextIdentity !== committedIdentity;
      setIsNavigating(nextIdentity !== committedIdentity);
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [
    cancelScheduled,
    committedQuery,
    onBrowserHistoryChange,
    pathname,
    scopeSlug,
    scopeType,
  ]);

  useEffect(
    () => () => {
      cancelScheduled();
    },
    [cancelScheduled],
  );

  return {
    isNavigating,
    navigateNow,
    scheduleReplace,
    cancelScheduled,
    shouldAcceptServerResult,
    markSettled,
  };
}
