"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export function AdminRefreshButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      disabled={isPending}
      aria-busy={isPending}
      onClick={() => {
        if (!isPending) startTransition(() => router.refresh());
      }}
      className="min-h-11 min-w-32 touch-manipulation self-start rounded-xl border-zinc-200 font-medium text-zinc-700 hover:bg-zinc-50 active:bg-zinc-100 active:duration-0 focus-visible:ring-brand/30"
    >
      <RefreshCw aria-hidden="true" className={`size-4 ${isPending ? "motion-safe:animate-spin" : ""}`} />
      <span aria-live="polite">{isPending ? "Refreshing…" : "Refresh"}</span>
    </Button>
  );
}
