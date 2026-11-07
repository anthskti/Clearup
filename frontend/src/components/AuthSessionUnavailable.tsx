"use client";

import { ServiceNotice } from "@/components/ServiceNotice";

export function AuthSessionUnavailable({
  retryAt,
  onRetry,
}: {
  retryAt: number | null;
  onRetry: () => void | Promise<void>;
}) {
  return (
    <ServiceNotice
      retryAt={retryAt}
      onRetry={onRetry}
      className="mb-4 w-full text-left"
    >
      We couldn’t check your session. Your account details are temporarily
      unavailable.
    </ServiceNotice>
  );
}
