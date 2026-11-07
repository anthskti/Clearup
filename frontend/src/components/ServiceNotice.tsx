"use client";

import type { ReactNode } from "react";
import { AuthRetryButton } from "@/components/AuthRetryButton";

export function ServiceNotice({
  children,
  retryAt = null,
  onRetry,
  isRetrying = false,
  disabled = false,
  busyLabel = "Retrying…",
  role = "alert",
  className = "",
}: {
  children: ReactNode;
  retryAt?: number | null;
  onRetry: () => void | Promise<void>;
  isRetrying?: boolean;
  disabled?: boolean;
  busyLabel?: ReactNode;
  role?: "alert" | "status";
  className?: string;
}) {
  return (
    <div
      className={`flex flex-col gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950 sm:flex-row sm:items-center sm:justify-between ${className}`}
    >
      <div role={role} className="min-w-0 flex-1">
        {children}
      </div>
      <AuthRetryButton
        retryAt={retryAt}
        onRetry={onRetry}
        isRetrying={isRetrying}
        disabled={disabled}
        busyLabel={busyLabel}
        className="min-h-11 w-fit shrink-0"
        variant="outline"
      />
    </div>
  );
}
