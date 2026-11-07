import { S3Client } from "@aws-sdk/client-s3";

export class R2ConfigurationError extends Error {}

let storage: { client: S3Client; bucket: string; publicUrl: string } | undefined;

export function getAvatarStorage() {
  if (storage) return storage;

  const accountId = process.env.R2_ACCOUNT_ID?.trim();
  const accessKeyId = process.env.R2_ACCESS_KEY_ID?.trim();
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY?.trim();
  const bucket = process.env.R2_BUCKET_NAME?.trim();
  const publicUrl = process.env.R2_PUBLIC_URL?.trim().replace(/\/+$/, "");

  if (!accountId || !accessKeyId || !secretAccessKey || !bucket || !publicUrl) {
    throw new R2ConfigurationError("Avatar uploads are not configured.");
  }

  try {
    const url = new URL(publicUrl);
    if (url.protocol !== "https:" || url.username || url.password || url.search || url.hash) {
      throw new Error("Invalid public image URL");
    }
  } catch {
    throw new R2ConfigurationError("Avatar uploads are not configured.");
  }

  storage = {
    client: new S3Client({
      region: "auto",
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: { accessKeyId, secretAccessKey },
    }),
    bucket,
    publicUrl,
  };
  return storage;
}
