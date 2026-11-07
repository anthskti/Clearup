import { createHash } from "node:crypto";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import sharp from "sharp";
import { getAvatarStorage } from "../lib/r2";

const MAX_IMAGE_PIXELS = 16_777_216;

export class AvatarUploadError extends Error {
  constructor(message: string, public readonly status: number) {
    super(message);
  }
}

export class AvatarService {
  async upload(image: Buffer): Promise<string> {
    let normalized: Buffer;

    try {
      const source = sharp(image, {
        animated: true,
        limitInputPixels: MAX_IMAGE_PIXELS,
      });
      const metadata = await source.metadata();

      if (!metadata.format || !["jpeg", "png", "webp"].includes(metadata.format)) {
        throw new AvatarUploadError("Choose a JPEG, PNG, or WebP image.", 415);
      }
      if ((metadata.pages ?? 1) > 1) {
        throw new AvatarUploadError("Choose a still image rather than an animation.", 400);
      }

      normalized = await source
        .rotate()
        .resize(256, 256, { fit: "cover" })
        .webp({ quality: 82 })
        .toBuffer();
    } catch (error) {
      if (error instanceof AvatarUploadError) throw error;
      throw new AvatarUploadError("Choose a valid image no larger than 16 megapixels.", 400);
    }

    const { client, bucket, publicUrl } = getAvatarStorage();
    const hash = createHash("sha256").update(normalized).digest("hex");
    const environment = process.env.NODE_ENV === "production" ? "production" : "staging";
    const key = `profilephotos/${environment}/${hash}.webp`;

    await client.send(new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: normalized,
      ContentType: "image/webp",
      CacheControl: "public, max-age=31536000, immutable",
    }));

    return `${publicUrl}/${key}`;
  }
}
