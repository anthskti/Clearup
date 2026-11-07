import { mutationHeaders } from "@/lib/mutationHeaders";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5050";
const MAX_AVATAR_BYTES = 5 * 1024 * 1024;
const AVATAR_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];

export function getAvatarFileError(file: File): string | null {
  if (!AVATAR_MIME_TYPES.includes(file.type)) {
    return "Choose a JPEG, PNG, or WebP image.";
  }
  if (file.size === 0 || file.size > MAX_AVATAR_BYTES) {
    return "Choose an image smaller than 5 MB.";
  }
  return null;
}

export async function uploadAvatar(file: File): Promise<string> {
  const fileError = getAvatarFileError(file);
  if (fileError) throw new Error(fileError);

  const response = await fetch(`${API_URL}/api/users/me/avatar`, {
    method: "POST",
    credentials: "include",
    cache: "no-store",
    headers: mutationHeaders({ "Content-Type": file.type }),
    body: file,
  });
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      typeof data?.error === "string"
        ? data.error
        : "Could not upload your photo. Please try again.",
    );
  }
  if (typeof data?.imageUrl !== "string") {
    throw new Error("Could not upload your photo. Please try again.");
  }
  return data.imageUrl;
}
