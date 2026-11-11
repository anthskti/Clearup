import express from "express";
import { UserController } from "../controllers/UserController";
import { AvatarController } from "../controllers/AvatarController";
import { requireAdmin, requireAuth } from "../middleware/requireAuth";
import { requireMutationHeader } from "../middleware/requireMutationHeader";
import rateLimit from "express-rate-limit";

const router = express.Router();
const userController = new UserController();
const avatarController = new AvatarController();
const parseAvatar = express.raw({
  type: ["image/jpeg", "image/png", "image/webp"],
  limit: "5mb",
});
const avatarUploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many photo uploads. Please try again later." },
});

router.post(
  "/me/avatar",
  requireAuth,
  requireMutationHeader,
  avatarUploadLimiter,
  (req, res, next) => {
    parseAvatar(req, res, (error?: { type?: string }) => {
      if (error) {
        const tooLarge = error.type === "entity.too.large";
        res.status(tooLarge ? 413 : 400).json({
          error: tooLarge ? "Choose an image smaller than 5 MB." : "Could not read that image.",
        });
        return;
      }
      next();
    });
  },
  (req, res) => avatarController.upload(req, res),
);

router.get("/admin", requireAdmin, (req, res) =>
  userController.listAdminUsers(req, res),
);

router.patch("/admin/:userId/moderation", requireAdmin, requireMutationHeader, (req, res) =>
  userController.moderateUser(req, res),
);

export default router;
