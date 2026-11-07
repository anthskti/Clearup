import type { Request, Response } from "express";
import { R2ConfigurationError } from "../lib/r2";
import { AvatarService, AvatarUploadError } from "../services/AvatarService";

export class AvatarController {
  private avatarService = new AvatarService();

  async upload(req: Request, res: Response): Promise<void> {
    if (!req.is(["image/jpeg", "image/png", "image/webp"])) {
      res.status(415).json({ error: "Choose a JPEG, PNG, or WebP image." });
      return;
    }
    if (!Buffer.isBuffer(req.body) || req.body.length === 0) {
      res.status(400).json({ error: "Choose an image to upload." });
      return;
    }

    try {
      const imageUrl = await this.avatarService.upload(req.body);
      res.json({ imageUrl });
    } catch (error) {
      if (error instanceof AvatarUploadError) {
        res.status(error.status).json({ error: error.message });
      } else if (error instanceof R2ConfigurationError) {
        res.status(503).json({ error: "Avatar uploads are not configured yet." });
      } else {
        res.status(500).json({ error: "Could not upload your photo. Please try again." });
      }
    }
  }
}
