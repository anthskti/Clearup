"use client";

import { useEffect, useState } from "react";
import { authClient } from "@/lib/auth-client";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5050";

type EffectiveRole = "user" | "admin";

type EffectiveUser = {
  id: string;
  email: string | null;
  role: EffectiveRole;
};

export function useEffectiveRole() {
  const { data: session, isPending } = authClient.useSession();
  const sessionId = session?.user?.id ?? null;
  const [user, setUser] = useState<EffectiveUser | null>(null);
  const [loadedSessionId, setLoadedSessionId] = useState<string | null>(null);

  useEffect(() => {
    if (isPending || !sessionId) return;

    let isCancelled = false;

    const run = async () => {
      try {
        const res = await fetch(`${API_URL}/api/auth/me`, {
          credentials: "include",
          cache: "no-store",
        });

        if (!res.ok) {
          if (!isCancelled) {
            setUser(null);
            setLoadedSessionId(sessionId);
          }
          return;
        }

        const data = (await res.json()) as EffectiveUser;
        if (!isCancelled) {
          setUser(data);
          setLoadedSessionId(sessionId);
        }
      } catch {
        if (!isCancelled) {
          setUser(null);
          setLoadedSessionId(sessionId);
        }
      }
    };

    void run();

    return () => {
      isCancelled = true;
    };
  }, [sessionId, isPending]);

  const effectiveUser =
    sessionId && loadedSessionId === sessionId ? user : null;
  const isLoadingRole =
    isPending || (sessionId !== null && loadedSessionId !== sessionId);

  return {
    isPendingSession: isPending,
    isLoadingRole,
    effectiveUser,
    effectiveRole: effectiveUser?.role ?? null,
    isAdmin: effectiveUser?.role === "admin",
  };
}
