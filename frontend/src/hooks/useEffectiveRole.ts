"use client";

import { useEffect, useState } from "react";
import { authClient } from "@/lib/auth-client";
import {
  getSessionRetryAt,
  isTemporaryAuthError,
  retryAtFromHeaders,
} from "@/lib/auth-retry";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5050";

type EffectiveRole = "user" | "admin";

type EffectiveUser = {
  id: string;
  email: string | null;
  role: EffectiveRole;
};

export function useEffectiveRole() {
  const {
    data: session,
    isPending,
    error: sessionError,
    refetch: refetchSession,
  } = authClient.useSession();
  const sessionId = session?.user?.id ?? null;
  const hasSessionError = Boolean(sessionError);
  const hasTemporarySessionError =
    hasSessionError && isTemporaryAuthError(sessionError);
  const [user, setUser] = useState<EffectiveUser | null>(null);
  const [loadedSessionId, setLoadedSessionId] = useState<string | null>(null);
  const [roleError, setRoleError] = useState(false);
  const [roleErrorSessionId, setRoleErrorSessionId] = useState<string | null>(null);
  const [roleRetryAt, setRoleRetryAt] = useState<number | null>(null);
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    if (isPending || hasSessionError || !sessionId) {
      return;
    }

    let isCancelled = false;

    const run = async () => {
      try {
        const res = await fetch(`${API_URL}/api/auth/me`, {
          credentials: "include",
          cache: "no-store",
        });

        if (!res.ok) {
          if (!isCancelled && (res.status === 401 || res.status === 403)) {
            setUser(null);
            setLoadedSessionId(sessionId);
            setRoleError(false);
            setRoleErrorSessionId(null);
            setRoleRetryAt(null);
          } else if (!isCancelled) {
            setRoleError(true);
            setRoleErrorSessionId(sessionId);
            setRoleRetryAt(retryAtFromHeaders(res.headers));
          }
          return;
        }

        const data = await res.json();
        if (
          !data ||
          typeof data.id !== "string" ||
          !data.id ||
          (data.role !== "user" && data.role !== "admin") ||
          (data.email !== null && typeof data.email !== "string")
        ) {
          throw new Error("Invalid effective user response");
        }
        if (!isCancelled) {
          setUser(data as EffectiveUser);
          setLoadedSessionId(sessionId);
          setRoleError(false);
          setRoleErrorSessionId(null);
          setRoleRetryAt(null);
        }
      } catch {
        if (!isCancelled) {
          setRoleError(true);
          setRoleErrorSessionId(sessionId);
          setRoleRetryAt(null);
        }
      }
    };

    void run();

    return () => {
      isCancelled = true;
    };
  }, [sessionId, isPending, hasSessionError, retryKey]);

  const effectiveUser =
    sessionId && loadedSessionId === sessionId ? user : null;
  const hasRoleLoaded = sessionId !== null && loadedSessionId === sessionId;
  const activeRoleError = roleError && roleErrorSessionId === sessionId;
  const isLoadingRole =
    isPending ||
    (sessionId !== null && !hasRoleLoaded && !activeRoleError && !sessionError);
  const activeRoleRetryAt =
    roleErrorSessionId === sessionId ||
    (hasTemporarySessionError && sessionId === null)
      ? roleRetryAt
      : null;
  const sessionRetryAt = hasTemporarySessionError ? getSessionRetryAt() : null;
  const retryAt = Math.max(
    activeRoleRetryAt ?? 0,
    sessionRetryAt ?? 0,
  ) || null;

  return {
    isPendingSession: isPending,
    isLoadingRole,
    effectiveUser,
    effectiveRole: effectiveUser?.role ?? null,
    isAdmin: effectiveUser?.role === "admin",
    error: Boolean(hasTemporarySessionError || activeRoleError),
    retryAt,
    retry: async () => {
      const cooldownUntil = retryAt;
      if (cooldownUntil && cooldownUntil > Date.now()) return;
      if (hasSessionError) {
        if (hasTemporarySessionError) await refetchSession();
        return;
      }
      if (!activeRoleError) return;
      setRoleError(false);
      setRetryKey((key) => key + 1);
    },
  };
}
