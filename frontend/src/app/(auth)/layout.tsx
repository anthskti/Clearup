"use client";

import { useEffect, useState } from "react";
import { authClient } from "@/lib/auth-client";
import { usePathname, useRouter } from "next/navigation";
import BrandedLoadingScreen from "@/components/BrandedLoadingScreen";
import ClearupLogoLink from "@/components/ClearupLogoLink";
import ProceduralWave from "@/components/themes/ProceduralWave";
import { AuthSessionUnavailable } from "@/components/AuthSessionUnavailable";
import { getSessionRetryAt, isTemporaryAuthError } from "@/lib/auth-retry";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session, isPending, error: sessionError, refetch } = authClient.useSession();
  const [sessionChecked, setSessionChecked] = useState(!isPending);

  // Background session refreshes must not unmount forms or repeat verification.
  if (!isPending && !sessionChecked) {
    setSessionChecked(true);
  }

  // If there is a session token, DO NOT show auth pages,
  // except verify-email which must be reachable after sign-up.
  useEffect(() => {
    if (!isPending && !sessionError && session && pathname !== "/verify-email") {
      router.push("/");
    }
  }, [isPending, sessionError, session, pathname, router]);

  if (isPending && !sessionChecked) {
    return (
      <BrandedLoadingScreen
        fullScreen
        title="Loading session"
        subtitle="Checking your Clearup account."
      />
    );
  }

  return (
    <div className="relative min-h-screen bg-[#F8F8F8]">
      <ProceduralWave
        seed={4}
        frequency={2}
        height={190}
        gradientFrom="#e9f6ff"
        gradientTo="#f0f8fc"
        flip
      />
      <div className="absolute top-0 left-0 z-20 px-4 py-4 md:px-6 md:py-5">
        <ClearupLogoLink priority />
      </div>
      {sessionError && isTemporaryAuthError(sessionError) && (
        <div className="px-4 pt-20 sm:px-6">
          <AuthSessionUnavailable
            retryAt={getSessionRetryAt()}
            onRetry={refetch}
          />
        </div>
      )}
      {children}
    </div>
  );
}
