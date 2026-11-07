"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { ServiceNotice } from "@/components/ServiceNotice";

export function AuthUnavailable({ retryAt }: { retryAt: number | null }) {
  const router = useRouter();
  const [isRefreshing, startTransition] = useTransition();

  return (
    <main className="mx-auto flex min-h-[50vh] max-w-lg flex-col justify-center gap-4 px-6 text-center">
      <h1 className="text-xl font-semibold">We couldn’t verify your session</h1>
      <ServiceNotice
        retryAt={retryAt}
        isRetrying={isRefreshing}
        onRetry={() => startTransition(() => router.refresh())}
        className="text-left"
      >
        Your account details are temporarily unavailable.
      </ServiceNotice>
    </main>
  );
}
