"use client";

import { AuthRetryButton } from "@/components/AuthRetryButton";

export function AuthSessionUnavailable({
  retryAt,
  onRetry,
}: {
  retryAt: number | null;
  onRetry: () => void | Promise<void>;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-12 text-center">
      <p className="text-sm text-zinc-600">
        We couldn’t check your session. Please try again.
      </p>
      <AuthRetryButton retryAt={retryAt} onRetry={onRetry} />
    </div>
  );
}
