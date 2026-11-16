"use server";

import { updateTag } from "next/cache";
import { cookies } from "next/headers";
import { mutationHeaders } from "@/lib/mutationHeaders";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5050";

export async function saveFeaturedRoutineOrder(
  routineIds: number[],
): Promise<{ error?: string }> {
  const cookieHeader = (await cookies())
    .getAll()
    .map((cookie) => `${cookie.name}=${cookie.value}`)
    .join("; ");
  const response = await fetch(`${API_URL}/api/routines/admin/featured`, {
    method: "PUT",
    cache: "no-store",
    headers: {
      ...mutationHeaders({ "Content-Type": "application/json" }),
      cookie: cookieHeader,
    },
    body: JSON.stringify({ routineIds }),
  });
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    return {
      error: (payload as { error?: string }).error || "Could not save featured routines.",
    };
  }
  updateTag("featured-routines");
  return {};
}
