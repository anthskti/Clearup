"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import type { ComponentProps, ReactNode } from "react";

export function AuthRetryButton({
  retryAt,
  onRetry,
  label = "Retry",
  busyLabel = "Retrying…",
  isRetrying = false,
  disabled = false,
  className,
  variant,
}: {
  retryAt: number | null;
  onRetry: () => void | Promise<void>;
  label?: ReactNode;
  busyLabel?: ReactNode;
  isRetrying?: boolean;
  disabled?: boolean;
  className?: string;
  variant?: ComponentProps<typeof Button>["variant"];
}) {
  const [now, setNow] = useState(0);
  const [isRetryingInternally, setIsRetryingInternally] = useState(false);
  useEffect(() => {
    if (!retryAt) return;
    const initial = window.setTimeout(() => setNow(Date.now()), 0);
    if (retryAt <= Date.now()) return () => window.clearTimeout(initial);
    const timer = window.setInterval(() => {
      const currentTime = Date.now();
      setNow(currentTime);
      if (currentTime >= retryAt) window.clearInterval(timer);
    }, 1000);
    return () => {
      window.clearTimeout(initial);
      window.clearInterval(timer);
    };
  }, [retryAt]);

  const seconds = retryAt && now > 0
    ? Math.max(0, Math.ceil((retryAt - now) / 1000))
    : 0;
  const cooldownPending = Boolean(retryAt && now === 0);
  const retryInProgress = isRetrying || isRetryingInternally;

  async function handleRetry() {
    if (disabled || retryInProgress || cooldownPending || seconds > 0) return;
    setIsRetryingInternally(true);
    try {
      await onRetry();
    } catch {
      // The owning view updates its error state; prevent an unhandled rejection.
    } finally {
      setIsRetryingInternally(false);
    }
  }

  return (
    <Button
      className={`min-h-11 ${className ?? ""}`}
      variant={variant}
      disabled={disabled || retryInProgress || cooldownPending || seconds > 0}
      onClick={() => void handleRetry()}
    >
      <span>
        {retryInProgress ? busyLabel : label}
        {!retryInProgress && seconds > 0 && ` in ${seconds}s`}
      </span>
    </Button>
  );
}
