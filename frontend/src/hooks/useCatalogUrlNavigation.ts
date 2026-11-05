"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  catalogIdentity,
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

  const cancelScheduled = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  }, []);

  const markSettled = useCallback(() => {
    hasPendingNavigation.current = false;
    setIsNavigating(false);
  }, []);

  const shouldAcceptServerResult = useCallback(
    (resultIdentity: string, committedIdentity: string) => {
      if (resultIdentity !== committedIdentity) return false;
      if (queuedQuery.current !== null) return false;
      if (
        hasPendingNavigation.current &&
        committedIdentity === navigationFromQuery.current
      ) {
        return false;
      }
      return true;
    },
    [],
  );

  const beginRouteChange = useCallback(
    (
      query: string,
      options: { replace: boolean; debounceMs?: number },
    ) => {
      cancelScheduled();

      if (options.debounceMs != null) {
        queuedQuery.current = query;
      } else {
        queuedQuery.current = null;
      }

      navigationFromQuery.current = catalogIdentity(pathname, committedQuery);
      onBeginNavigation();

      const sameQuery = queriesEqual(query, committedQuery);
      setIsNavigating(!sameQuery);
      hasPendingNavigation.current = !sameQuery;
      if (sameQuery) {
        queuedQuery.current = null;
        return;
      }

      const url = `${basePath}${query ? `?${query}` : ""}`;
      if (options.debounceMs != null) {
        timer.current = setTimeout(() => {
          timer.current = null;
          queuedQuery.current = null;
          hasPendingNavigation.current = true;
          router.replace(url, { scroll: false });
        }, options.debounceMs);
        return;
      }

      if (options.replace) router.replace(url, { scroll: false });
      else router.push(url, { scroll: false });
    },
    [
      basePath,
      cancelScheduled,
      committedQuery,
      onBeginNavigation,
      pathname,
      router,
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
