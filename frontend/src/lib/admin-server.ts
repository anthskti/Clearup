import "server-only";
import { cookies } from "next/headers";
import { mutationHeaders } from "@/lib/mutationHeaders";
import type { RoutineWithProducts, FeaturedRoutine } from "@/types/routine";
import type { AdminDashboardStats } from "@/types/routine-admin";
import type { AdminUsersPagePayload, AdminUsersQuery } from "@/types/admin";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5050";

async function cookieHeader(): Promise<string> {
  const store = await cookies();
  return store
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join("; ");
}

async function fetchWithCookies(
  path: string,
  init?: RequestInit,
): Promise<Response> {
  const cookie = await cookieHeader();
  const method = init?.method?.toUpperCase() ?? "GET";
  const needsMutationHeader = ["POST", "PUT", "PATCH", "DELETE"].includes(
    method,
  );
  return fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      ...(needsMutationHeader ? mutationHeaders() : {}),
      ...init?.headers,
      cookie,
    },
    cache: "no-store",
  });
}

export async function getAdminDashboardStatsServer(
  days = 30,
): Promise<AdminDashboardStats> {
  const res = await fetchWithCookies(
    `/api/routines/admin/stats?days=${encodeURIComponent(String(days))}`,
  );
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      (err as { error?: string }).error || "Failed to load admin stats",
    );
  }
  return res.json();
}

export async function getFeaturedRoutinesServer(): Promise<FeaturedRoutine[]> {
  const res = await fetchWithCookies("/api/routines/admin/featured");
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      (err as { error?: string }).error || "Failed to load featured routines",
    );
  }
  return res.json();
}

export async function getAdminUsersServer(
  params: AdminUsersQuery,
): Promise<AdminUsersPagePayload> {
  const limit = params.limit ?? 25;
  const offset = params.offset ?? 0;
  const query = new URLSearchParams({ limit: String(limit), offset: String(offset) });
  if (params.search) query.set("search", params.search);
  if (params.role) query.set("role", params.role);
  if (params.verified !== undefined) query.set("verified", String(params.verified));
  const res = await fetchWithCookies(
    `/api/users/admin?${query.toString()}`,
  );
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      (err as { error?: string }).error || "Failed to load users",
    );
  }
  return res.json();
}

export async function getAllRoutinesServer(
  limit = 100,
  offset = 0,
): Promise<RoutineWithProducts[]> {
  const res = await fetch(
    `${API_URL}/api/routines?limit=${limit}&offset=${offset}`,
    { cache: "no-store" },
  );
  if (!res.ok) {
    throw new Error("Failed to load routines");
  }
  return res.json();
}
