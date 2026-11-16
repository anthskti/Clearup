"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { mutationHeaders } from "@/lib/mutationHeaders";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5050";
const TRACKING_WINDOW_MS = 5 * 60 * 1000;

export default function UserActivityTracker() {
  const { data: session } = authClient.useSession();
  const trackedUserId = session?.user?.id ?? null;
  const pathname = usePathname();
  const userIdRef = useRef<string | null>(null);
  const lastAttemptAtRef = useRef(0);
  const requestInFlightRef = useRef(false);
  const requestTokenRef = useRef(0);

  useEffect(() => {
    if (userIdRef.current !== trackedUserId) {
      userIdRef.current = trackedUserId;
      lastAttemptAtRef.current = 0;
      requestInFlightRef.current = false;
    }
  }, [trackedUserId]);

  useEffect(() => {
    if (!trackedUserId) return;

    const recordActivity = () => {
      const userId = userIdRef.current;
      if (
        !userId || document.visibilityState !== "visible" ||
        requestInFlightRef.current ||
        Date.now() - lastAttemptAtRef.current < TRACKING_WINDOW_MS
      ) return;

      lastAttemptAtRef.current = Date.now();
      requestInFlightRef.current = true;
      const token = ++requestTokenRef.current;
      void fetch(`${API_URL}/api/users/me/activity`, {
        method: "POST",
        credentials: "include",
        cache: "no-store",
        headers: mutationHeaders(),
      }).catch(() => undefined).finally(() => {
        if (token === requestTokenRef.current) requestInFlightRef.current = false;
      });
    };

    const onTrustedEvent = (event: Event) => {
      if (event.isTrusted) recordActivity();
    };
    const onVisibilityChange = (event: Event) => {
      if (event.isTrusted && document.visibilityState === "visible") recordActivity();
    };

    recordActivity();
    document.addEventListener("pointerdown", onTrustedEvent, { passive: true });
    document.addEventListener("keydown", onTrustedEvent);
    document.addEventListener("click", onTrustedEvent);
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      document.removeEventListener("pointerdown", onTrustedEvent);
      document.removeEventListener("keydown", onTrustedEvent);
      document.removeEventListener("click", onTrustedEvent);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [trackedUserId, pathname]);

  return null;
}
