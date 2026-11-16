import { mutationHeaders } from "@/lib/mutationHeaders";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5050";

export type UserModerationAction =
  | { action: "suspend"; durationDays: 1 | 7 | 30; reason: string }
  | { action: "ban"; reason: string }
  | { action: "restore" };

export async function moderateUser(userId: string, action: UserModerationAction) {
  const response = await fetch(
    `${API_URL}/api/users/admin/${encodeURIComponent(userId)}/moderation`,
    {
      method: "PATCH",
      credentials: "include",
      cache: "no-store",
      headers: mutationHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify(action),
    },
  );
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.error || "Could not update this account.");
  }
  return payload as {
    ok: true;
    accountStatus: "active" | "suspended" | "banned";
    banReason: string | null;
    banExpires: string | null;
  };
}
