"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import type { CatalogError } from "@/types/product";

export default function MerchantOffersNotice({
  error,
  isRetrying,
  onRetry,
}: {
  error: CatalogError;
  isRetrying: boolean;
  onRetry: () => void | Promise<void>;
}) {
  const [now, setNow] = useState(0);
  const retryAt = error.retryAt;

  useEffect(() => {
    if (!retryAt) return;
    const initial = window.setTimeout(() => setNow(Date.now()), 0);
    const timer = window.setInterval(() => {
      const current = Date.now();
      setNow(current);
      if (current >= retryAt) window.clearInterval(timer);
    }, 1000);
    return () => {
      window.clearTimeout(initial);
      window.clearInterval(timer);
    };
  }, [retryAt]);

  const seconds = retryAt && now > 0
    ? Math.max(0, Math.ceil((retryAt - now) / 1000))
    : 0;

  return (
    <div role="status" className="mb-4 flex flex-wrap items-center gap-3 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
      <span>
        {error.status === 429
          ? "Merchant prices are temporarily rate limited. Previously loaded prices are kept."
          : "Some merchant prices could not be loaded. Previously loaded prices are kept."}
      </span>
      <Button
        variant="outline"
        size="sm"
        disabled={isRetrying || Boolean(retryAt && now === 0) || seconds > 0}
        onClick={() => void onRetry()}
      >
        {isRetrying ? "Retrying prices…" : seconds > 0 ? `Retry prices in ${seconds}s` : "Retry prices"}
      </Button>
    </div>
  );
}
