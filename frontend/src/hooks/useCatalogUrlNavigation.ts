"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { canonicalQuery, queriesEqual } from "@/lib/productCatalogUrl";

const FILTER_DEBOUNCE_MS = 250;

interface UseCatalogUrlNavigationOptions {
  basePath: string;
  committedQuery: string;
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
  committedQuery,
  onBeginNavigation,
  onBrowserHistoryChange,
}: UseCatalogUrlNavigationOptions) {
  const router = useRouter();
  const [isNavigating, setIsNavigating] = useState(false);
  const [isRoutePending, startRouteTransition] = useTransition();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const queuedQuery = useRef<string | null>(null);
  /** Last query actually issued to the router; queued debounce changes are separate. */
  const issuedDestinationQuery = useRef<string | null>(null);

  const cancelScheduled = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  }, []);

  const markSettled = useCallback(() => {
    issuedDestinationQuery.current = null;
    setIsNavigating(false);
  }, []);

  const shouldAcceptServerResult = useCallback(
    (resultIdentity: string, committedIdentity: string) => {
      if (resultIdentity !== committedIdentity) return false;
      if (isNavigating && queuedQuery.current !== null) return false;
      if (isRoutePending) return false;
      // The committed URL owns a completed result, including same-URL replaces
      // and redirects. Comparing it to the requested URL would reject both.
      return true;
    },
    // A cancelled debounce can settle without changing the URL or SSR props.
    [isRoutePending, isNavigating],
  );

  const issueRoute = useCallback(
    (query: string, replace: boolean) => {
      const url = `${basePath}${query ? `?${query}` : ""}`;
      issuedDestinationQuery.current = canonicalQuery(query);
      startRouteTransition(() => {
        if (replace) router.replace(url, { scroll: false });
        else router.push(url, { scroll: false });
      });
    },
    [basePath, router, startRouteTransition],
  );

  const beginRouteChange = useCallback(
    (
      query: string,
      options: { replace: boolean; debounceMs?: number },
    ) => {
      cancelScheduled();

      const desired = canonicalQuery(query);

      const desiredEqualsCommitted = queriesEqual(desired, committedQuery);
      const outstandingDifferentDestination =
        issuedDestinationQuery.current !== null &&
        !queriesEqual(issuedDestinationQuery.current, desired);

      if (options.debounceMs != null && !desiredEqualsCommitted) {
        queuedQuery.current = query;
      } else {
        queuedQuery.current = null;
      }

      onBeginNavigation();

      // Already on the desired URL and nothing in flight to undo — done.
      if (desiredEqualsCommitted && !outstandingDifferentDestination) {
        issuedDestinationQuery.current = null;
        setIsNavigating(false);
        return;
      }

      // Desired equals committed but a different destination was issued:
      // supersede immediately so the in-flight filter nav cannot win.
      setIsNavigating(true);

      if (desiredEqualsCommitted && outstandingDifferentDestination) {
        issueRoute(query, true);
        return;
      }

      if (options.debounceMs != null) {
        timer.current = setTimeout(() => {
          timer.current = null;
          queuedQuery.current = null;
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
      // Next owns history navigation. Drop our superseded work and accept its
      // eventual committed URL, which can differ after a server redirect.
      markSettled();
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [
    cancelScheduled,
    markSettled,
    onBrowserHistoryChange,
  ]);

  useEffect(
    () => () => {
      cancelScheduled();
    },
    [cancelScheduled],
  );

  return {
    isNavigating: isNavigating || isRoutePending,
    navigateNow,
    scheduleReplace,
    cancelScheduled,
    shouldAcceptServerResult,
    markSettled,
  };
}
