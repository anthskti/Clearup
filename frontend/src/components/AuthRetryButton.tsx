"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import type { ComponentProps } from "react";

export function AuthRetryButton({
  retryAt,
  onRetry,
  label = "Retry",
  className,
  variant,
}: {
  retryAt: number | null;
  onRetry: () => void | Promise<void>;
  label?: string;
  className?: string;
  variant?: ComponentProps<typeof Button>["variant"];
}) {
  const [now, setNow] = useState(0);
  useEffect(() => {
    if (!retryAt) return;
    const initial = window.setTimeout(() => setNow(Date.now()), 0);
    if (retryAt <= Date.now()) return () => window.clearTimeout(initial);
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => {
      window.clearTimeout(initial);
      window.clearInterval(timer);
    };
  }, [retryAt]);

  const seconds = retryAt && now > 0
    ? Math.max(0, Math.ceil((retryAt - now) / 1000))
    : 0;
  const cooldownPending = Boolean(retryAt && now === 0);
  return (
    <Button className={className} variant={variant} disabled={cooldownPending || seconds > 0} onClick={() => void onRetry()}>
      {seconds > 0 ? `${label} in ${seconds}s` : label}
    </Button>
  );
}
