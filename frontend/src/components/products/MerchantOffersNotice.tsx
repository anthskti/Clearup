"use client";

import { ServiceNotice } from "@/components/ServiceNotice";
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
  return (
    <ServiceNotice
      retryAt={error.retryAt}
      isRetrying={isRetrying}
      onRetry={onRetry}
      className="mb-4"
    >
      {error.status === 429
        ? "Merchant prices are temporarily rate limited. Any prices already loaded are still shown."
        : "We couldn’t load some merchant prices. Any prices already loaded are still shown."}
    </ServiceNotice>
  );
}
