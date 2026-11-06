"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function AuthUnavailable({ retryAt }: { retryAt: number | null }) {
  const router = useRouter();
  const [now, setNow] = useState(0);
  const [isRefreshing, startTransition] = useTransition();
  useEffect(() => {
    if (!retryAt) return;
    const update = () => setNow(Date.now());
    const initial = window.setTimeout(update, 0);
    if (retryAt <= Date.now()) return () => window.clearTimeout(initial);
    const timer = window.setInterval(update, 1000);
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
    <main className="mx-auto flex min-h-[50vh] max-w-lg flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-xl font-semibold">We couldn’t verify your session</h1>
      <p className="text-sm text-zinc-600">
        Your account details are temporarily unavailable. Please try again
        {seconds ? ` in ${seconds} seconds` : ""}.
      </p>
      <Button
        disabled={isRefreshing || cooldownPending || seconds > 0}
        onClick={() => startTransition(() => router.refresh())}
      >
        {isRefreshing ? "Checking…" : "Try again"}
      </Button>
    </main>
  );
}
